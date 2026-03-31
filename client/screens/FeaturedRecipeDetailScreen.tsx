import React, { useCallback, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { CookbookPickerModal } from "@/components/CookbookPickerModal";
import { SkeletonBox } from "@/components/SkeletonLoader";
import { FallbackImage } from "@/components/FallbackImage";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import { resolveImageUrl } from "@/lib/query-client";
import {
  Spacing,
  BorderRadius,
  FontFamily,
  withOpacity,
} from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { CommunityRecipe } from "@shared/schema";
import type { CarouselRecipeCard } from "@shared/types/carousel";
import type { MealSuggestion } from "@shared/types/meal-suggestions";

const CLOSE_BUTTON_SIZE = 44;
const HERO_IMAGE_HEIGHT = 250;
const HERO_PLACEHOLDER_HEIGHT = 200;

type FeaturedRecipeDetailRouteProp = RouteProp<
  RootStackParamList,
  "FeaturedRecipeDetail"
>;

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

function InfoChip({ icon, text }: { icon: FeatherIconName; text: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: theme.backgroundSecondary }]}>
      <Feather name={icon} size={14} color={theme.textSecondary} />
      <ThemedText style={[styles.chipText, { color: theme.textSecondary }]}>
        {text}
      </ThemedText>
    </View>
  );
}

function RecipeDetailSkeleton() {
  React.useEffect(() => {
    AccessibilityInfo.announceForAccessibility("Loading");
  }, []);

  return (
    <View accessibilityElementsHidden>
      {/* Hero image placeholder */}
      <SkeletonBox width="100%" height={HERO_IMAGE_HEIGHT} borderRadius={0} />
      <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
        {/* Title */}
        <SkeletonBox width="75%" height={22} />
        {/* Description lines */}
        <SkeletonBox width="100%" height={15} />
        <SkeletonBox width="85%" height={15} />
        {/* Info chips */}
        <View
          style={{
            flexDirection: "row",
            gap: Spacing.sm,
            marginTop: Spacing.xs,
          }}
        >
          <SkeletonBox width={80} height={28} borderRadius={BorderRadius.xs} />
          <SkeletonBox width={70} height={28} borderRadius={BorderRadius.xs} />
          <SkeletonBox width={90} height={28} borderRadius={BorderRadius.xs} />
        </View>
        {/* Save button */}
        <SkeletonBox
          width={140}
          height={36}
          borderRadius={BorderRadius.full}
          style={{ marginTop: Spacing.xs }}
        />
        {/* Instructions title */}
        <SkeletonBox
          width={120}
          height={20}
          style={{ marginTop: Spacing.md }}
        />
        {/* Instruction text lines */}
        <SkeletonBox width="100%" height={15} />
        <SkeletonBox width="90%" height={15} />
        <SkeletonBox width="95%" height={15} />
        <SkeletonBox width="70%" height={15} />
      </View>
    </View>
  );
}

function normalizeToCommunityRecipe(card: CarouselRecipeCard): CommunityRecipe {
  const data = card.recipeData;

  // AI-generated suggestions
  if (card.source === "ai") {
    const ai = data as MealSuggestion;
    return {
      id: 0,
      authorId: null,
      barcode: null,
      normalizedProductName: card.title.toLowerCase(),
      title: card.title,
      description: ai.description,
      difficulty: ai.difficulty,
      timeEstimate: ai.prepTimeMinutes ? `${ai.prepTimeMinutes} minutes` : null,
      servings: 2,
      dietTags: ai.dietTags,
      instructions: ai.instructions,
      imageUrl: card.imageUrl,
      isPublic: true,
      likeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Community recipes
  if (card.source === "community" && "instructions" in data) {
    return data as unknown as CommunityRecipe;
  }

  // Catalog recipes (minimal data)
  return {
    id: 0,
    authorId: null,
    barcode: null,
    normalizedProductName: card.title.toLowerCase(),
    title: card.title,
    description: card.recommendationReason,
    difficulty: null,
    timeEstimate: card.prepTimeMinutes
      ? `${card.prepTimeMinutes} minutes`
      : null,
    servings: null,
    dietTags: [],
    instructions: "View full recipe for instructions.",
    imageUrl: card.imageUrl,
    isPublic: true,
    likeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export default function FeaturedRecipeDetailScreen() {
  const route = useRoute<FeaturedRecipeDetailRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { recipeId, carouselCard } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const haptics = useHaptics();

  const {
    data: fetchedRecipe,
    isLoading: isFetching,
    error,
  } = useQuery<CommunityRecipe>({
    queryKey: [`/api/recipes/${recipeId}`],
    enabled: !carouselCard, // Skip fetch if carousel card data provided
  });

  // Normalize carousel card data into CommunityRecipe-like shape for display
  const recipe: CommunityRecipe | undefined = carouselCard
    ? normalizeToCommunityRecipe(carouselCard)
    : fetchedRecipe;
  const isLoading = !carouselCard && isFetching;

  const dismiss = useCallback(() => navigation.goBack(), [navigation]);
  const [pickerVisible, setPickerVisible] = useState(false);

  const imageUri = useMemo(
    () => resolveImageUrl(recipe?.imageUrl),
    [recipe?.imageUrl],
  );

  const uniqueTags = useMemo(
    () => [...new Set(recipe?.dietTags ?? [])],
    [recipe?.dietTags],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {/* Close button — floats over hero image */}
      <View style={[styles.sheetHeader, { top: insets.top + Spacing.xs }]}>
        <Pressable
          onPress={dismiss}
          hitSlop={8}
          accessibilityLabel="Close"
          accessibilityRole="button"
          style={styles.closeButton}
        >
          <Feather name="chevron-down" size={20} color={theme.buttonText} />
        </Pressable>
      </View>

      {isLoading ? (
        <ScrollView contentInsetAdjustmentBehavior="never">
          <RecipeDetailSkeleton />
        </ScrollView>
      ) : error || !recipe ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={32} color={theme.textSecondary} />
          <ThemedText
            style={{ marginTop: Spacing.sm, color: theme.textSecondary }}
          >
            Recipe not found
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + Spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
        >
          {/* Hero image */}
          <FallbackImage
            source={{ uri: imageUri ?? undefined }}
            style={styles.heroImage}
            fallbackStyle={{
              backgroundColor: theme.backgroundSecondary,
              height: HERO_PLACEHOLDER_HEIGHT,
            }}
            fallbackIcon="image"
            fallbackIconSize={48}
            resizeMode="cover"
            accessibilityLabel={`Photo of ${recipe.title}`}
          />

          <View style={styles.content}>
            {/* Title */}
            <ThemedText type="h3" style={styles.title}>
              {recipe.title}
            </ThemedText>

            {/* Description */}
            {recipe.description ? (
              <ThemedText
                style={[styles.description, { color: theme.textSecondary }]}
              >
                {recipe.description}
              </ThemedText>
            ) : null}

            {/* Info chips */}
            <View style={styles.chipRow}>
              {recipe.difficulty ? (
                <InfoChip icon="bar-chart-2" text={recipe.difficulty} />
              ) : null}
              {recipe.timeEstimate ? (
                <InfoChip icon="clock" text={recipe.timeEstimate} />
              ) : null}
              {recipe.servings ? (
                <InfoChip icon="users" text={`${recipe.servings} servings`} />
              ) : null}
            </View>

            {/* Save to Cookbook */}
            <Pressable
              onPress={() => {
                haptics.impact();
                setPickerVisible(true);
              }}
              style={[
                styles.saveButton,
                { backgroundColor: withOpacity(theme.link, 0.1) },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save to cookbook"
            >
              <Feather name="bookmark" size={14} color={theme.link} />
              <ThemedText
                style={[styles.saveButtonText, { color: theme.link }]}
              >
                Save to Cookbook
              </ThemedText>
            </Pressable>

            {/* Diet tags */}
            {uniqueTags.length > 0 ? (
              <View style={styles.tagRow}>
                {uniqueTags.map((tag) => (
                  <View
                    key={tag}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: withOpacity(theme.link, 0.1),
                      },
                    ]}
                  >
                    <ThemedText style={[styles.tagText, { color: theme.link }]}>
                      {tag}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Instructions */}
            <Card elevation={1} style={styles.instructionsCard}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Instructions
              </ThemedText>
              <ThemedText style={styles.instructions}>
                {recipe.instructions}
              </ThemedText>
            </Card>
          </View>
        </ScrollView>
      )}

      <CookbookPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        recipeId={recipeId}
        recipeType="community"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sheetHeader: {
    position: "absolute",
    right: Spacing.md,
    zIndex: 10,
  },
  closeButton: {
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    borderRadius: CLOSE_BUTTON_SIZE / 2,
    backgroundColor: withOpacity("#000000", 0.4), // hardcoded — black overlay for close button
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    width: "100%",
    height: HERO_IMAGE_HEIGHT,
  },
  heroPlaceholder: {
    width: "100%",
    height: HERO_PLACEHOLDER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  chipText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  tagText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  instructionsCard: {
    padding: Spacing.lg,
  },
  instructions: {
    fontSize: 15,
    lineHeight: 24,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  saveButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
});
