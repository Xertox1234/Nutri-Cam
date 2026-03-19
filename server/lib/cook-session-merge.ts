/**
 * Pure functions for cook session ingredient merging.
 * Extracted from server/routes/cooking.ts for testability.
 */

import type { CookingSessionIngredient } from "@shared/types/cook-session";

/**
 * Maximum number of ingredients allowed per session.
 */
export const MAX_INGREDIENTS_PER_SESSION = 20;

/**
 * Merges newly detected ingredients into an existing ingredient list.
 *
 * Dedup logic: if an exact name match (case-insensitive) exists and the
 * existing ingredient has NOT been user-edited, the quantity is accumulated
 * and confidence is taken as the max. User-edited ingredients are never
 * overwritten by AI detections.
 *
 * Returns a new array (does not mutate the input).
 */
export function mergeDetectedIngredients(
  existing: CookingSessionIngredient[],
  incoming: CookingSessionIngredient[],
  maxIngredients: number = MAX_INGREDIENTS_PER_SESSION,
): CookingSessionIngredient[] {
  // Deep-clone existing so we don't mutate input
  const merged: CookingSessionIngredient[] = existing.map((i) => ({ ...i }));

  for (const newItem of incoming) {
    const existingIndex = merged.findIndex(
      (i) =>
        i.name.toLowerCase() === newItem.name.toLowerCase() && !i.userEdited,
    );

    if (existingIndex !== -1) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: merged[existingIndex].quantity + newItem.quantity,
        confidence: Math.max(
          merged[existingIndex].confidence,
          newItem.confidence,
        ),
      };
    } else if (merged.length < maxIngredients) {
      merged.push({ ...newItem });
    }
  }

  return merged;
}
