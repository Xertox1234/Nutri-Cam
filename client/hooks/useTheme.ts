import { useContext, createContext } from "react";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/theme";

type ThemePreference = "light" | "dark" | "system";

interface ThemeContextType {
  preference: ThemePreference;
  colorScheme: "light" | "dark";
  isDark: boolean;
  setPreference: (pref: ThemePreference) => Promise<void>;
}

// Reference to ThemeContext - set by ThemeProvider
let _themeContext: React.Context<ThemeContextType | undefined> | null = null;

export function registerThemeContext(
  ctx: React.Context<ThemeContextType | undefined>,
) {
  _themeContext = ctx;
}

export function useTheme() {
  const systemColorScheme = useColorScheme();

  // Try to get theme from context if available
  let resolvedColorScheme: "light" | "dark" = systemColorScheme ?? "light";

  if (_themeContext) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const themeCtx = useContext(_themeContext);
    if (themeCtx) {
      resolvedColorScheme = themeCtx.colorScheme;
    }
  }

  const isDark = resolvedColorScheme === "dark";
  const theme = Colors[resolvedColorScheme];

  return {
    theme,
    isDark,
    colorScheme: resolvedColorScheme,
  };
}
