import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Chip } from "@/components/Chip";
import { useAccessibility } from "@/hooks/useAccessibility";
import { Spacing, FontFamily } from "@/constants/theme";

const TAGS = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Salads",
  "Pasta",
  "Smoothies",
  "Vegan",
  "Quick Meals",
];

interface TrendingTagsProps {
  onTagPress: (tag: string) => void;
}

export function TrendingTags({ onTagPress }: TrendingTagsProps) {
  const { reducedMotion } = useAccessibility();

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(150).duration(400)}
      style={styles.container}
    >
      <ThemedText type="body" style={styles.title}>
        Trending Search
      </ThemedText>
      <View style={styles.tagsRow}>
        {TAGS.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            variant="outline"
            onPress={() => onTagPress(tag)}
            accessibilityLabel={`Search for ${tag} recipes`}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.md,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
});
