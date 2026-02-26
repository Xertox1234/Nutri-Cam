/**
 * Pure calculation utilities for AdaptiveGoalCard.
 * Extracted for testability — no React or RN dependencies.
 */

interface MacroDiff {
  diff: number;
  isIncrease: boolean;
}

/** Calculate the difference between two values and whether it's an increase. */
export function calculateDiff(previous: number, next: number): MacroDiff {
  const diff = next - previous;
  return { diff, isIncrease: diff > 0 };
}

/** Format a signed diff label: "+5" or "-3" or "0". */
export function formatDiffLabel(diff: number, isIncrease: boolean): string {
  if (diff === 0) return "0";
  return `${isIncrease ? "+" : ""}${diff}`;
}

/** Format weight trend rate string, e.g. "+0.5 kg/week" or "-0.2 kg/week". */
export function formatWeightTrend(rate: number): string {
  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate} kg/week`;
}
