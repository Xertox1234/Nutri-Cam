/**
 * Pure constants and formatting utilities for RecipeGenerationModal.
 * Extracted for testability — no React or RN dependencies.
 */

export const DIET_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Low-Carb",
  "Keto",
  "Dairy-Free",
  "Kid-Friendly",
  "Quick & Easy",
] as const;

export const TIME_OPTIONS = [
  { label: "15 min", value: "15 minutes" },
  { label: "30 min", value: "30 minutes" },
  { label: "45 min", value: "45 minutes" },
  { label: "1 hour", value: "1 hour" },
  { label: "Any", value: undefined },
] as const;

export const SERVING_OPTIONS = [1, 2, 4, 6, 8] as const;

/** Format a list of foods into a comma-separated ingredient context string. */
export function formatIngredientsContext(
  foods: { name: string; quantity: string }[],
): string {
  return foods.map((f) => `${f.name} (${f.quantity})`).join(", ");
}
