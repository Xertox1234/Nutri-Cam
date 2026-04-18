/**
 * Pure helpers for TagsStep. No React Native imports — safe for Vitest.
 */

import type { DietTag } from "./types";

/**
 * Returns the next diet-tag array after toggling the given tag. If the tag is
 * present it is removed; otherwise it is appended. The input array is never
 * mutated. Using this pure helper keeps the TagsStep component free of
 * mutation-order bugs and makes the toggle behavior trivially testable.
 */
export function toggleDietTag(
  current: readonly DietTag[],
  tag: DietTag,
): DietTag[] {
  const isActive = current.includes(tag);
  return isActive ? current.filter((t) => t !== tag) : [...current, tag];
}

/**
 * True when the user has typed a visible cuisine value (whitespace trimmed).
 * The UI shows a "suggested" badge when this returns true.
 */
export function hasCuisineText(cuisine: string): boolean {
  return cuisine.trim().length > 0;
}

/**
 * Label shown on a diet chip. Appends a checkmark when the tag is selected —
 * the rendering is identical on iOS/Android, so the formatting lives in the
 * pure helper instead of inlined JSX.
 */
export function formatDietChipLabel(tag: DietTag, isActive: boolean): string {
  return isActive ? `${tag} ✓` : tag;
}
