import { useReducedMotion } from "react-native-reanimated";
import { AccessibilityInfo } from "react-native";
import { useState, useEffect } from "react";

/**
 * Hook for accessibility preferences.
 * Provides reduced motion status and other accessibility settings.
 */
export function useAccessibility() {
  const reducedMotion = useReducedMotion();
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setScreenReaderEnabled,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    /** Whether the user prefers reduced motion */
    reducedMotion: reducedMotion ?? false,
    /** Whether a screen reader is active */
    screenReaderEnabled,
  };
}
