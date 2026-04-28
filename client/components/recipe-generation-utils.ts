/**
 * Pure constants and formatting utilities for RecipeGenerationModal.
 * Extracted for testability — no React or RN dependencies.
 */

// Re-export from shared so the client and server both use the canonical set.
export { DIET_OPTIONS } from "@shared/schemas/recipe";

export const TIME_OPTIONS = [
  { label: "15 min", value: "15 minutes" },
  { label: "30 min", value: "30 minutes" },
  { label: "45 min", value: "45 minutes" },
  { label: "1 hour", value: "1 hour" },
  { label: "Any", value: undefined },
] as const;

export const SERVING_OPTIONS = [1, 2, 4, 6, 8] as const;

/**
 * Format a list of foods into a comma-separated ingredient context string.
 *
 * Trust boundary (M3): the `name` and `quantity` fields here originate from
 * the vision model's photo-analysis output (AI-generated, not direct user
 * input). The assembled string is sent to the server as `productName` where
 * `sanitizeUserInput()` is applied before it is injected into the
 * recipe-generation prompt — that call in `recipe-generation.ts` is the
 * server-side trust boundary for this data path.
 */
export function formatIngredientsContext(
  foods: { name: string; quantity: string }[],
): string {
  return foods.map((f) => `${f.name} (${f.quantity})`).join(", ");
}
