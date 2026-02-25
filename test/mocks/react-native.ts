// Mock react-native for Vitest — the real module uses Flow syntax that Rollup can't parse.
export const Platform = {
  OS: "ios",
  select: (obj: Record<string, unknown>) => obj.ios,
};
export const useColorScheme = () => "light";
export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: (style: unknown) => style,
};
export const Appearance = { getColorScheme: () => "light" };
export const Dimensions = { get: () => ({ width: 375, height: 812 }) };
export const Alert = { alert: () => {} };
export const Linking = { openURL: async () => {} };
export const NativeModules = {};
export default {
  Platform,
  useColorScheme,
  StyleSheet,
  Appearance,
  Dimensions,
  Alert,
  Linking,
  NativeModules,
};
