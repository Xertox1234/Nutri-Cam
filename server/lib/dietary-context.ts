import type { UserProfile } from "@shared/schema";
import { ALLERGEN_INGREDIENT_MAP } from "@shared/constants/allergens";
import type { AllergenId } from "@shared/constants/allergens";
import { sanitizeUserInput } from "./ai-safety";

export interface DietaryContextOptions {
  /**
   * Controls allergen detail level:
   * - "basic": Simple allergen names list (e.g. "MUST AVOID these allergens: peanuts, gluten")
   * - "extended": Full severity + ingredient examples from ALLERGEN_INGREDIENT_MAP
   *
   * Default: "extended"
   */
  allergenDetail?: "basic" | "extended";

  /**
   * Additional diet preferences to append (e.g. from user input on recipe generation).
   */
  additionalPreferences?: string[];
}

/**
 * Build a dietary context string from a user profile.
 *
 * This is the single canonical implementation used across recipe-generation,
 * meal-suggestions, recipe-chat, and pantry-meal-plan services.
 */
export function buildDietaryContext(
  userProfile: UserProfile | null | undefined,
  options?: DietaryContextOptions,
): string {
  const parts: string[] = [];
  const allergenDetail = options?.allergenDetail ?? "extended";

  if (userProfile) {
    if (
      userProfile.allergies &&
      Array.isArray(userProfile.allergies) &&
      userProfile.allergies.length > 0
    ) {
      if (allergenDetail === "extended") {
        const allergyLines: string[] = [];
        for (const allergy of userProfile.allergies as {
          name: string;
          severity?: string;
        }[]) {
          const severity = allergy.severity ?? "moderate";
          const def =
            ALLERGEN_INGREDIENT_MAP[allergy.name as AllergenId] ??
            ALLERGEN_INGREDIENT_MAP[allergy.name.toLowerCase() as AllergenId];
          if (def) {
            const examples = def.directIngredients.slice(0, 8).join(", ");
            allergyLines.push(
              `${severity.toUpperCase()} (${severity === "severe" ? "life-threatening" : severity === "moderate" ? "noticeable reaction" : "slight discomfort"}): ${def.label} — avoid: ${examples}`,
            );
          } else {
            allergyLines.push(
              `${severity.toUpperCase()}: ${sanitizeUserInput(allergy.name)}`,
            );
          }
        }
        parts.push(
          `CRITICAL ALLERGY RESTRICTIONS:\n${allergyLines.join("\n")}`,
        );
      } else {
        // Basic: simple names list
        const allergyNames = (userProfile.allergies as { name: string }[]).map(
          (a) => sanitizeUserInput(a.name),
        );
        parts.push(`MUST AVOID these allergens: ${allergyNames.join(", ")}`);
      }
    }

    if (userProfile.dietType) {
      parts.push(`Diet type: ${sanitizeUserInput(userProfile.dietType)}`);
    }

    if (
      userProfile.foodDislikes &&
      Array.isArray(userProfile.foodDislikes) &&
      userProfile.foodDislikes.length > 0
    ) {
      parts.push(
        `Dislikes: ${userProfile.foodDislikes.map((d) => sanitizeUserInput(String(d))).join(", ")}`,
      );
    }

    if (userProfile.cookingSkillLevel) {
      parts.push(
        `Cooking skill: ${sanitizeUserInput(userProfile.cookingSkillLevel)}`,
      );
    }

    if (userProfile.cookingTimeAvailable) {
      parts.push(
        `Preferred cooking time: ${sanitizeUserInput(userProfile.cookingTimeAvailable)}`,
      );
    }

    if (
      userProfile.cuisinePreferences &&
      Array.isArray(userProfile.cuisinePreferences) &&
      userProfile.cuisinePreferences.length > 0
    ) {
      parts.push(
        `Cuisine preferences: ${userProfile.cuisinePreferences.map((c) => sanitizeUserInput(String(c))).join(", ")}`,
      );
    }
  }

  if (
    options?.additionalPreferences &&
    options.additionalPreferences.length > 0
  ) {
    parts.push(
      `Additional preferences: ${options.additionalPreferences.map(sanitizeUserInput).join(", ")}`,
    );
  }

  return parts.length > 0 ? parts.join(". ") + "." : "";
}
