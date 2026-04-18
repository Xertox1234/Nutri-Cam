import React, { createContext, useContext, useEffect } from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  cancelAnimation,
  type SharedValue,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useAccessibility } from "@/hooks/useAccessibility";
import { Spacing, BorderRadius } from "@/constants/theme";

/**
 * Context that shares a single shimmer driver between many `SkeletonBox`
 * instances. When present, each box reads the driver via context instead of
 * spawning its own `useSharedValue` + `withRepeat` worklet. This keeps
 * long skeleton lists (3N+ boxes) at a single animation worklet rather
 * than one per box.
 *
 * The value is a `SharedValue<number>` cycling 0 → 1 → 0 (via
 * `interpolate` in the consumer) on a 1200ms repeat. When `reducedMotion`
 * is active, the provider publishes a static `0.5` so consumers resolve
 * to mid-opacity without running any worklet.
 */
const SkeletonShimmerContext = createContext<SharedValue<number> | null>(null);

interface SkeletonProviderProps {
  children: React.ReactNode;
}

/**
 * Owns a single shimmer driver for all `SkeletonBox` descendants. Wrap
 * lists or screens that render 3+ skeletons. Single-box usage can skip
 * the provider — `SkeletonBox` falls back to a per-instance timer when
 * the context is absent.
 */
export function SkeletonProvider({ children }: SkeletonProviderProps) {
  const { reducedMotion } = useAccessibility();
  const shimmerValue = useSharedValue(reducedMotion ? 0.5 : 0);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(shimmerValue);
      shimmerValue.value = 0.5;
      return;
    }

    shimmerValue.value = 0;
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(shimmerValue);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shimmerValue is a stable ref from useSharedValue that never changes identity
  }, [reducedMotion]);

  return (
    <SkeletonShimmerContext.Provider value={shimmerValue}>
      {children}
    </SkeletonShimmerContext.Provider>
  );
}

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A single skeleton placeholder box with shimmer animation.
 *
 * When rendered inside a `<SkeletonProvider>`, reads the provider's
 * shared shimmer value — no per-instance worklet is spawned. When
 * rendered outside a provider (ad-hoc single-box usage), falls back to
 * its own `useSharedValue` + `withRepeat` so existing call sites keep
 * working unchanged.
 */
export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonBoxProps) {
  const contextValue = useContext(SkeletonShimmerContext);

  if (contextValue) {
    return (
      <SharedSkeletonBox
        shimmerValue={contextValue}
        width={width}
        height={height}
        borderRadius={borderRadius}
        style={style}
      />
    );
  }

  return (
    <StandaloneSkeletonBox
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
}

interface SharedSkeletonBoxProps extends SkeletonBoxProps {
  shimmerValue: SharedValue<number>;
}

function SharedSkeletonBox({
  shimmerValue,
  width = "100%",
  height = 16,
  borderRadius = 4,
  style,
}: SharedSkeletonBoxProps) {
  const { theme } = useTheme();

  const shimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmerValue.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3],
    );
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.backgroundSecondary,
        },
        shimmerStyle,
        style,
      ]}
    />
  );
}

function StandaloneSkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonBoxProps) {
  const { theme } = useTheme();
  const { reducedMotion } = useAccessibility();
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      shimmerValue.value = 0.5;
      return;
    }

    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(shimmerValue);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shimmerValue is a stable ref from useSharedValue that never changes identity
  }, [reducedMotion]);

  const shimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmerValue.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3],
    );
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.backgroundSecondary,
        },
        shimmerStyle,
        style,
      ]}
    />
  );
}

interface SkeletonItemProps {
  /** Index for staggered opacity effect */
  index?: number;
  /** Custom content layout */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * A skeleton list item with image and text placeholders.
 * Default layout matches common list item patterns.
 */
export function SkeletonItem({
  index = 0,
  children,
  style,
}: SkeletonItemProps) {
  const { theme } = useTheme();

  const defaultContent = (
    <>
      <SkeletonBox width={56} height={56} borderRadius={BorderRadius.xs} />
      <View style={styles.skeletonText}>
        <SkeletonBox width="70%" height={16} />
        <SkeletonBox width="40%" height={16} />
      </View>
    </>
  );

  return (
    <View
      style={[
        styles.skeletonItem,
        { backgroundColor: theme.backgroundDefault },
        { opacity: 1 - index * 0.1 },
        style,
      ]}
      accessibilityLabel="Loading..."
    >
      {children || defaultContent}
    </View>
  );
}

interface SkeletonListProps {
  /** Number of skeleton items to render */
  count?: number;
  /** Custom item renderer */
  renderItem?: (index: number) => React.ReactNode;
}

/**
 * A skeleton loading list with multiple items.
 *
 * Wraps its children in a `SkeletonProvider` so every nested
 * `SkeletonBox` (default or `renderItem`-supplied) shares one shimmer
 * driver. A 10-item list with 3 boxes each runs 1 worklet instead of 30.
 */
export function SkeletonList({ count = 5, renderItem }: SkeletonListProps) {
  return (
    <SkeletonProvider>
      <View style={styles.skeletonContainer}>
        {Array.from({ length: count }, (_, i) =>
          renderItem ? (
            <React.Fragment key={i}>{renderItem(i)}</React.Fragment>
          ) : (
            <SkeletonItem key={i} index={i} />
          ),
        )}
      </View>
    </SkeletonProvider>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    gap: Spacing.md,
  },
  skeletonItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius["2xl"],
    gap: Spacing.md,
  },
  skeletonText: {
    flex: 1,
    gap: Spacing.sm,
  },
});
