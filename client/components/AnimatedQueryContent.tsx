import React, { ReactNode, useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAccessibility } from "@/hooks/useAccessibility";
import { contentRevealTimingConfig } from "@/constants/animations";

interface AnimatedQueryContentProps {
  /** Whether the content is still loading */
  isLoading: boolean;
  children: ReactNode;
}

/**
 * Fades in content when loading completes, preventing the jarring "pop"
 * that occurs when query data arrives and replaces a skeleton/spinner.
 *
 * Wrap around the post-loading content (not the skeleton itself).
 */
export function AnimatedQueryContent({
  isLoading,
  children,
}: AnimatedQueryContentProps) {
  const { reducedMotion } = useAccessibility();
  const opacity = useSharedValue(isLoading ? 0 : 1);

  useEffect(() => {
    if (!isLoading) {
      opacity.value = reducedMotion
        ? 1
        : withTiming(1, contentRevealTimingConfig);
    } else {
      opacity.value = 0;
    }
  }, [isLoading, opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (isLoading) {
    return null;
  }

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
