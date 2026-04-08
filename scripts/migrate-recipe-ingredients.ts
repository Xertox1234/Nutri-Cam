// scripts/migrate-recipe-ingredients.ts
/**
 * One-time migration: Extract ingredients embedded in the instructions array
 * into the proper ingredients array for community recipes.
 *
 * Affected recipes have `ingredients: []` and their ingredient list stored
 * inside `instructions`, bracketed by "Ingredients:" and "Instructions:" labels.
 *
 * Usage:
 *   npx tsx scripts/migrate-recipe-ingredients.ts           # live run
 *   npx tsx scripts/migrate-recipe-ingredients.ts --dry-run # preview only
 */
import "dotenv/config";
import { db } from "../server/db";
import { communityRecipes } from "../shared/schema";
import { sql, eq } from "drizzle-orm";

const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Ingredient parsing
// ---------------------------------------------------------------------------

function parseIngredientLine(raw: string): {
  name: string;
  quantity: string;
  unit: string;
} {
  // Match: "200g rice noodles", "3 tbsp fish sauce", "1/2 cup flour"
  const match = raw.match(
    /^(\d+(?:[\/\.]\d+)?)\s*(g|kg|ml|l|oz|lb|lbs|cup|cups|tbsp|tsp|tablespoons?|teaspoons?|ounces?|pounds?|bunch|head|clove|cloves|stalk|stalks|piece|pieces|slice|slices|can|cans|handful|pinch)?\s+(.+)$/i,
  );
  if (match) {
    return { quantity: match[1], unit: match[2] ?? "", name: match[3].trim() };
  }
  // "1 cucumber, thinly sliced" — quantity + name, no unit
  const simpleMatch = raw.match(/^(\d+(?:[\/\.]\d+)?)\s+(.+)$/);
  if (simpleMatch) {
    return {
      quantity: simpleMatch[1],
      unit: "",
      name: simpleMatch[2].trim(),
    };
  }
  // No quantity — "Fresh herbs (mint, cilantro, Thai basil)"
  return { quantity: "", unit: "", name: raw };
}

// ---------------------------------------------------------------------------
// Instruction/ingredient splitting
// ---------------------------------------------------------------------------

interface SplitResult {
  ingredients: { name: string; quantity: string; unit: string }[];
  instructions: string[];
}

function splitInstructionsArray(lines: string[]): SplitResult | null {
  // Find the "Ingredients:" marker
  const ingredientsMarkerIdx = lines.findIndex((l) =>
    /^ingredients\s*:/i.test(l.trim()),
  );
  if (ingredientsMarkerIdx === -1) {
    return null;
  }

  const ingredientLines: string[] = [];
  const instructionLines: string[] = [];
  let foundInstructions = false;

  for (let i = ingredientsMarkerIdx + 1; i < lines.length; i++) {
    const line = lines[i];

    // Check for embedded "Instructions:" at end of a line (e.g. "chili\n\nInstructions:")
    const embeddedIdx = line.indexOf("\nInstructions:");
    if (embeddedIdx !== -1) {
      // Text before the embedded marker is the last ingredient line
      const lastIngredient = line.slice(0, embeddedIdx).trim();
      if (lastIngredient) {
        ingredientLines.push(lastIngredient);
      }
      // Text after "Instructions:" on the same split (skip the label itself)
      const afterLabel = line
        .slice(embeddedIdx + "\nInstructions:".length)
        .trim();
      if (afterLabel) {
        instructionLines.push(afterLabel);
      }
      foundInstructions = true;
      // Remaining lines are all instructions
      for (let j = i + 1; j < lines.length; j++) {
        const step = lines[j].trim();
        if (step) instructionLines.push(step);
      }
      break;
    }

    // Check for standalone "Instructions:" label
    if (/^instructions\s*:/i.test(line.trim())) {
      foundInstructions = true;
      // Remaining lines are all instructions
      for (let j = i + 1; j < lines.length; j++) {
        const step = lines[j].trim();
        if (step) instructionLines.push(step);
      }
      break;
    }

    // Still in ingredient section
    const trimmed = line.trim();
    if (trimmed) {
      ingredientLines.push(trimmed);
    }
  }

  if (!foundInstructions) {
    // No "Instructions:" marker found — cannot safely split
    return null;
  }

  const ingredients = ingredientLines.map(parseIngredientLine);

  return { ingredients, instructions: instructionLines };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== LIVE RUN ===");
  console.log();

  // Query all community recipes where ingredients array is empty
  const recipes = await db
    .select({
      id: communityRecipes.id,
      title: communityRecipes.title,
      instructions: communityRecipes.instructions,
      ingredients: communityRecipes.ingredients,
    })
    .from(communityRecipes)
    .where(
      sql`COALESCE(jsonb_array_length(${communityRecipes.ingredients}), 0) = 0`,
    );

  console.log(`Found ${recipes.length} recipe(s) with empty ingredients.\n`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const recipe of recipes) {
    const instructions = recipe.instructions as string[];

    if (!Array.isArray(instructions) || instructions.length === 0) {
      console.log(
        `[SKIP] #${recipe.id} "${recipe.title}" — instructions is empty or not an array`,
      );
      skippedCount++;
      continue;
    }

    const result = splitInstructionsArray(instructions);

    if (!result) {
      console.log(
        `[SKIP] #${recipe.id} "${recipe.title}" — no Ingredients:/Instructions: markers found`,
      );
      skippedCount++;
      continue;
    }

    console.log(`[MIGRATE] #${recipe.id} "${recipe.title}"`);
    console.log(
      `  Before: ${instructions.length} instruction lines, 0 ingredients`,
    );
    console.log(
      `  After:  ${result.instructions.length} instruction steps, ${result.ingredients.length} ingredients`,
    );

    if (result.ingredients.length > 0) {
      console.log("  Sample ingredients:");
      result.ingredients.slice(0, 3).forEach((ing) => {
        const parts = [ing.quantity, ing.unit, ing.name].filter(Boolean);
        console.log(`    - ${parts.join(" ")}`);
      });
      if (result.ingredients.length > 3) {
        console.log(`    ... and ${result.ingredients.length - 3} more`);
      }
    }

    if (result.instructions.length > 0) {
      console.log(`  First instruction step: "${result.instructions[0]}"`);
    }
    console.log();

    if (!DRY_RUN) {
      await db
        .update(communityRecipes)
        .set({
          ingredients: result.ingredients,
          instructions: result.instructions,
        })
        .where(eq(communityRecipes.id, recipe.id));
    }

    migratedCount++;
  }

  console.log("---");
  console.log(`Migrated: ${migratedCount}`);
  console.log(`Skipped:  ${skippedCount}`);

  if (DRY_RUN) {
    console.log("\nDry run complete — no changes written.");
  } else {
    console.log("\nMigration complete.");
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
