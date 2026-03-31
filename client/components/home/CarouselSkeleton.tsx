import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, withOpacity } from "@/constants/theme";
import { CARD_WIDTH } from "./CarouselRecipeCard";

const SKELETON_COUNT = 2;
const IMAGE_HEIGHT = 140;

export const CarouselSkeleton = React.memo(function CarouselSkeleton() {
  const { theme } = useTheme();
  const bg = withOpacity(theme.text, 0.06);

  return (
    <View style={styles.row}>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <View
          key={i}
          style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}
        >
          <View style={[styles.imagePlaceholder, { backgroundColor: bg }]} />
          <View style={styles.content}>
            <View style={[styles.titleLine, { backgroundColor: bg }]} />
            <View style={[styles.subtitleLine, { backgroundColor: bg }]} />
          </View>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.card,
    overflow: "hidden",
  },
  imagePlaceholder: {
    width: "100%",
    height: IMAGE_HEIGHT,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  titleLine: {
    height: 16,
    width: "70%",
    borderRadius: 4,
  },
  subtitleLine: {
    height: 12,
    width: "50%",
    borderRadius: 4,
  },
});
