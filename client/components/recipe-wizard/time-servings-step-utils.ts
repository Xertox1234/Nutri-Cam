/**
 * Pure helpers for TimeServingsStep. No React Native imports — safe for Vitest.
 */

/** Minimum allowed servings value (the button disables at this floor). */
export const MIN_SERVINGS = 1;

/** Maximum allowed servings value (the button disables at this ceiling). */
export const MAX_SERVINGS = 99;

/**
 * Applies a delta (+1 / -1 usually) to the current servings count and clamps
 * the result to `[MIN_SERVINGS, MAX_SERVINGS]`. Callers can detect a no-op by
 * comparing the result to the input.
 */
export function clampServings(current: number, delta: number): number {
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, current + delta));
}

/**
 * Strips all non-digit characters from a user-entered minutes string. Keeps
 * the input as a string (not a number) so empty state and leading-zero cases
 * don't silently become `0` and round-trip through `parseInt`.
 */
export function sanitizeMinutesInput(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Sums the prep + cook minutes into a single total. Non-numeric strings (the
 * empty state) contribute 0.
 */
export function computeTotalMinutes(
  prepTime: string,
  cookTime: string,
): number {
  const prep = parseInt(prepTime, 10) || 0;
  const cook = parseInt(cookTime, 10) || 0;
  return prep + cook;
}

/**
 * True when the "-" stepper button should be disabled (already at the floor).
 */
export function isServingsAtMin(servings: number): boolean {
  return servings <= MIN_SERVINGS;
}

/**
 * True when the "+" stepper button should be disabled (already at the ceiling).
 */
export function isServingsAtMax(servings: number): boolean {
  return servings >= MAX_SERVINGS;
}
