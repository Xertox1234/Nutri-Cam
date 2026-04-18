/**
 * Pure helpers for TitleStep. No React Native imports — safe for Vitest.
 */

/** Maximum number of characters allowed in the recipe title input. */
export const TITLE_MAX_LENGTH = 200;

/** Maximum number of characters allowed in the recipe description input. */
export const DESCRIPTION_MAX_LENGTH = 2000;

/** Minimum characters required before the user can advance from step 1. */
export const TITLE_MIN_LENGTH = 3;

/**
 * Returns `true` when the given title meets the wizard's minimum length
 * requirement after trimming. Whitespace-only titles are never valid.
 */
export function isValidTitle(title: string): boolean {
  return title.trim().length >= TITLE_MIN_LENGTH;
}

/**
 * Truncates the input to {@link TITLE_MAX_LENGTH} characters. Used as a
 * defensive belt-and-suspenders companion to the `TextInput` `maxLength`
 * prop, which relies on the native platform to enforce the cap.
 */
export function truncateTitle(input: string): string {
  return input.length > TITLE_MAX_LENGTH
    ? input.slice(0, TITLE_MAX_LENGTH)
    : input;
}

/**
 * Truncates the description to {@link DESCRIPTION_MAX_LENGTH} characters.
 */
export function truncateDescription(input: string): string {
  return input.length > DESCRIPTION_MAX_LENGTH
    ? input.slice(0, DESCRIPTION_MAX_LENGTH)
    : input;
}
