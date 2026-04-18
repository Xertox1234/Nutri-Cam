/**
 * Pure helpers for InstructionsStep. No React Native imports — safe for Vitest.
 */

/**
 * The delete button is only shown when more than one step is present so the
 * user can never remove the only remaining step row.
 */
export function shouldShowStepDelete(rowCount: number): boolean {
  return rowCount > 1;
}

/**
 * The "move up" arrow is disabled on the first row — there is no row above it.
 */
export function canMoveStepUp(index: number): boolean {
  return index > 0;
}

/**
 * The "move down" arrow is disabled on the last row — there is no row below it.
 */
export function canMoveStepDown(index: number, total: number): boolean {
  return index < total - 1;
}
