/**
 * Utility functions for color manipulation.
 */

/**
 * Adds opacity to a hex color string.
 * @param color - Hex color string (e.g., "#FF0000" or "#F00")
 * @param opacity - Opacity value from 0 to 100 (e.g., 15 for 15% opacity)
 * @returns Hex color with alpha channel (e.g., "#FF000026")
 */
export function withOpacity(color: string, opacity: number): string {
  // Convert opacity percentage (0-100) to hex (00-FF)
  const alpha = Math.round((opacity / 100) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${color}${alpha}`;
}
