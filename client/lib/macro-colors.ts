import { Colors } from "@/constants/theme";

type Theme = (typeof Colors)["light"] | (typeof Colors)["dark"];

/**
 * Macro nutrient color keys for consistent usage across the app.
 */
export type MacroType = "calories" | "protein" | "carbs" | "fat";

/**
 * Get the accent color for a macro nutrient from the current theme.
 */
export function getMacroColor(theme: Theme, macro: MacroType): string {
  const macroColors: Record<MacroType, string> = {
    calories: theme.calorieAccent,
    protein: theme.proteinAccent,
    carbs: theme.carbsAccent,
    fat: theme.fatAccent,
  };
  return macroColors[macro];
}

/**
 * Get all macro colors from the current theme.
 */
export function getMacroColors(theme: Theme): Record<MacroType, string> {
  return {
    calories: theme.calorieAccent,
    protein: theme.proteinAccent,
    carbs: theme.carbsAccent,
    fat: theme.fatAccent,
  };
}
