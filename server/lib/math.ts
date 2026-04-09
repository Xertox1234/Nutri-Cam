/**
 * Round a number to one decimal place.
 *
 * Replaces the repeated `Math.round(x * 10) / 10` pattern across service files.
 */
export function roundToOneDecimal(n: number): number {
  return Math.round(n * 10) / 10;
}
