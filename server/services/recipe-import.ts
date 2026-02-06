import { z } from "zod";
import * as cheerio from "cheerio";
import type {
  ParsedIngredient,
  ImportedRecipeData,
} from "@shared/types/recipe-import";

export type {
  ParsedIngredient,
  ImportedRecipeData,
} from "@shared/types/recipe-import";

// ── Zod Schema for schema.org Recipe LD+JSON ─────────────────────────

const howToStepSchema = z.object({
  "@type": z.literal("HowToStep").optional(),
  text: z.string(),
});

const schemaOrgRecipeSchema = z.object({
  "@type": z.union([z.literal("Recipe"), z.array(z.string())]),
  name: z.string(),
  description: z.string().optional(),
  image: z.union([z.string(), z.array(z.string())]).optional(),
  recipeIngredient: z.array(z.string()).optional(),
  recipeInstructions: z
    .union([z.string(), z.array(z.union([z.string(), howToStepSchema]))])
    .optional(),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
  totalTime: z.string().optional(),
  recipeYield: z.union([z.string(), z.array(z.string())]).optional(),
  recipeCuisine: z.union([z.string(), z.array(z.string())]).optional(),
  recipeCategory: z.union([z.string(), z.array(z.string())]).optional(),
  keywords: z.union([z.string(), z.array(z.string())]).optional(),
  nutrition: z
    .object({
      calories: z.string().optional(),
      proteinContent: z.string().optional(),
      carbohydrateContent: z.string().optional(),
      fatContent: z.string().optional(),
      fiberContent: z.string().optional(),
      sugarContent: z.string().optional(),
      sodiumContent: z.string().optional(),
    })
    .optional(),
});

// ── Types ────────────────────────────────────────────────────────────

export type ImportResult =
  | { success: true; data: ImportedRecipeData }
  | {
      success: false;
      error: "NO_RECIPE_DATA" | "FETCH_FAILED" | "PARSE_ERROR";
    };

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Parse ISO 8601 duration (e.g., "PT15M", "PT1H30M") into minutes.
 */
export function parseIsoDuration(duration: string | undefined): number | null {
  if (!duration) return null;
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return null;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  return hours * 60 + minutes;
}

/**
 * Normalize recipeInstructions from either a single string or
 * an array of strings/HowToStep objects into a single text block.
 */
export function normalizeInstructions(
  instructions: z.infer<typeof schemaOrgRecipeSchema>["recipeInstructions"],
): string | null {
  if (!instructions) return null;
  if (typeof instructions === "string") {
    return instructions.replace(/<[^>]*>/g, "").trim() || null;
  }
  return (
    instructions
      .map((step, i) => {
        const text = typeof step === "string" ? step : step.text;
        return `${i + 1}. ${text.replace(/<[^>]*>/g, "").trim()}`;
      })
      .join("\n") || null
  );
}

/**
 * Parse a recipe ingredient string into structured parts.
 * Handles patterns like "2 cups flour", "1/2 tsp salt", "3 large eggs".
 */
export function parseIngredientString(raw: string): ParsedIngredient {
  const trimmed = raw.trim();

  // Match: optional quantity (including fractions like 1/2 or unicode fractions)
  // followed by optional unit, followed by name
  const match = trimmed.match(
    /^([\d\s./\u00BC-\u00BE\u2150-\u215E]+)?\s*(tablespoons?|teaspoons?|ounces?|pounds?|gallons?|liters?|quarts?|pints?|grams?|slices?|pieces?|cloves?|stalks?|sprigs?|heads?|medium|large|small|cups?|tbsp|tsp|bunch|pinch|dash|cans?|lbs?|oz|lb|kg|ml|g|l)?\s*(?:of\s+)?(.+)/i,
  );

  if (!match || !match[3]) {
    return { name: trimmed, quantity: null, unit: null };
  }

  const quantity = match[1]?.trim() || null;
  const unit = match[2]?.trim() || null;
  const name = match[3].trim();

  return { name, quantity, unit };
}

/**
 * Extract numeric value from nutrition string (e.g., "250 calories" → "250").
 */
function parseNutritionValue(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/([\d.]+)/);
  return match ? match[1] : null;
}

function extractFirstString(val: string | string[] | undefined): string | null {
  if (!val) return null;
  if (Array.isArray(val)) return val[0] || null;
  return val;
}

function parseServings(
  recipeYield: string | string[] | undefined,
): number | null {
  const raw = extractFirstString(recipeYield);
  if (!raw) return null;
  const match = raw.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// ── LD+JSON Extraction ───────────────────────────────────────────────

/**
 * Find a Recipe object in parsed LD+JSON data.
 * Handles both top-level Recipe and @graph arrays.
 */
export function findRecipeInLdJson(data: unknown): unknown | null {
  if (!data || typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;

  // Check if this is a Recipe
  const type = obj["@type"];
  if (type === "Recipe") return obj;
  if (Array.isArray(type) && type.includes("Recipe")) return obj;

  // Check @graph array
  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"] as unknown[]) {
      const found = findRecipeInLdJson(item);
      if (found) return found;
    }
  }

  // Check if it's an array at top level
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInLdJson(item);
      if (found) return found;
    }
  }

  return null;
}

// ── Main Import Function ─────────────────────────────────────────────

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "::1",
]);

function isBlockedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return true;
    if (BLOCKED_HOSTS.has(parsed.hostname)) return true;
    // Block private IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x)
    const parts = parsed.hostname.split(".").map(Number);
    if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
      if (parts[0] === 10) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
      if (parts[0] === 169 && parts[1] === 254) return true;
    }
    return false;
  } catch {
    return true;
  }
}

export async function importRecipeFromUrl(url: string): Promise<ImportResult> {
  if (isBlockedUrl(url)) {
    return { success: false, error: "FETCH_FAILED" };
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NutriScan/1.0; +https://nutriscan.app)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      return { success: false, error: "FETCH_FAILED" };
    }
    html = await res.text();
  } catch {
    return { success: false, error: "FETCH_FAILED" };
  }

  const $ = cheerio.load(html);

  // Find all LD+JSON scripts
  let recipeData: unknown = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipeData) return; // already found
    try {
      const json = JSON.parse($(el).text());
      const found = findRecipeInLdJson(json);
      if (found) recipeData = found;
    } catch {
      // Invalid JSON, skip
    }
  });

  if (!recipeData) {
    return { success: false, error: "NO_RECIPE_DATA" };
  }

  const parsed = schemaOrgRecipeSchema.safeParse(recipeData);
  if (!parsed.success) {
    console.error("Recipe LD+JSON parse error:", parsed.error.flatten());
    return { success: false, error: "PARSE_ERROR" };
  }

  const recipe = parsed.data;

  const imageUrl = Array.isArray(recipe.image)
    ? recipe.image[0] || null
    : recipe.image || null;

  const keywords = recipe.keywords
    ? typeof recipe.keywords === "string"
      ? recipe.keywords.split(",").map((k) => k.trim())
      : recipe.keywords
    : [];

  const data: ImportedRecipeData = {
    title: recipe.name,
    description: recipe.description || null,
    servings: parseServings(recipe.recipeYield),
    prepTimeMinutes: parseIsoDuration(recipe.prepTime),
    cookTimeMinutes: parseIsoDuration(recipe.cookTime),
    cuisine: extractFirstString(recipe.recipeCuisine),
    dietTags: keywords,
    ingredients: (recipe.recipeIngredient || []).map(parseIngredientString),
    instructions: normalizeInstructions(recipe.recipeInstructions),
    imageUrl,
    caloriesPerServing: parseNutritionValue(recipe.nutrition?.calories),
    proteinPerServing: parseNutritionValue(recipe.nutrition?.proteinContent),
    carbsPerServing: parseNutritionValue(recipe.nutrition?.carbohydrateContent),
    fatPerServing: parseNutritionValue(recipe.nutrition?.fatContent),
    sourceUrl: url,
  };

  return { success: true, data };
}
