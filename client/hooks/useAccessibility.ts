import { useReducedMotion } from "react-native-reanimated";

/**
 * Hook for accessibility preferences.
 * Provides reduced motion status and other accessibility settings.
 */
export function useAccessibility() {
  const reducedMotion = useReducedMotion();

  return {
    /** Whether the user prefers reduced motion */
    reducedMotion: reducedMotion ?? false,
  };
}
