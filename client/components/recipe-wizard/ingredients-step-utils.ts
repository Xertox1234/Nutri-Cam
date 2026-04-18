/**
 * Pure helpers for IngredientsStep. No React Native imports — safe for Vitest.
 */

/**
 * The delete button is only shown when more than one row is present so the
 * user can never remove the only remaining ingredient row. Callers pass the
 * current ingredient count.
 */
export function shouldShowIngredientDelete(rowCount: number): boolean {
  return rowCount > 1;
}

/**
 * True when the row has any non-whitespace text. Used to compute the "filled"
 * ingredient count and to gate form submission.
 */
export function hasIngredientText(row: { text: string }): boolean {
  return row.text.trim().length > 0;
}

/**
 * Counts how many rows have non-whitespace text.
 */
export function countFilledIngredients(
  rows: readonly { text: string }[],
): number {
  return rows.filter(hasIngredientText).length;
}
