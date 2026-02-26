/**
 * Shared appetite level data and lookups.
 * Used by both AppetiteTracker and MedicationLogCard.
 * Extracted for testability — no React or RN dependencies.
 */

export interface AppetiteLevel {
  value: number;
  label: string;
  emoji: string;
}

export const APPETITE_LEVELS: AppetiteLevel[] = [
  { value: 1, label: "Very Low", emoji: "\u{1F636}" },
  { value: 2, label: "Low", emoji: "\u{1F642}" },
  { value: 3, label: "Normal", emoji: "\u{1F60A}" },
  { value: 4, label: "High", emoji: "\u{1F60B}" },
  { value: 5, label: "Very High", emoji: "\u{1F924}" },
];

/** Get appetite label by numeric level (1-5). Returns empty string for invalid values. */
export function getAppetiteLabel(level: number | null): string {
  if (level == null || level < 1 || level > 5 || level % 1 !== 0) return "";
  return APPETITE_LEVELS[level - 1].label;
}

/** Get appetite emoji by numeric level (1-5). Returns empty string for invalid values. */
export function getAppetiteEmoji(level: number | null): string {
  if (level == null || level < 1 || level > 5 || level % 1 !== 0) return "";
  return APPETITE_LEVELS[level - 1].emoji;
}
