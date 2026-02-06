import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import {
  Spacing,
  BorderRadius,
  FontFamily,
  withOpacity,
} from "@/constants/theme";
import { useCreateMealPlanRecipe } from "@/hooks/useMealPlanRecipes";
import type { MealPlanStackParamList } from "@/navigation/MealPlanStackNavigator";
import type { RecipeCreateScreenNavigationProp } from "@/types/navigation";

type RecipeCreateRouteProp = RouteProp<MealPlanStackParamList, "RecipeCreate">;

const DIET_TAG_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten Free",
  "Dairy Free",
  "Keto",
  "Paleo",
  "Low Carb",
  "High Protein",
];

interface IngredientRow {
  key: string;
  name: string;
  quantity: string;
  unit: string;
}

let ingredientKeyCounter = 0;
function nextIngredientKey() {
  return `ing_${++ingredientKeyCounter}`;
}

// ── Input Field ──────────────────────────────────────────────────────

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.formField}>
      <ThemedText style={[styles.formLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────

export default function RecipeCreateScreen() {
  const navigation = useNavigation<RecipeCreateScreenNavigationProp>();
  const route = useRoute<RecipeCreateRouteProp>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const haptics = useHaptics();

  const prefill = route.params?.prefill;
  const createMutation = useCreateMealPlanRecipe();

  // Form state
  const [title, setTitle] = useState(prefill?.title || "");
  const [description, setDescription] = useState(prefill?.description || "");
  const [servings, setServings] = useState(
    prefill?.servings ? String(prefill.servings) : "2",
  );
  const [prepTime, setPrepTime] = useState(
    prefill?.prepTimeMinutes ? String(prefill.prepTimeMinutes) : "",
  );
  const [cookTime, setCookTime] = useState(
    prefill?.cookTimeMinutes ? String(prefill.cookTimeMinutes) : "",
  );
  const [cuisine, setCuisine] = useState(prefill?.cuisine || "");
  const [selectedDietTags, setSelectedDietTags] = useState<string[]>(
    prefill?.dietTags || [],
  );
  const [instructions, setInstructions] = useState(prefill?.instructions || "");
  const [calories, setCalories] = useState(prefill?.caloriesPerServing || "");
  const [protein, setProtein] = useState(prefill?.proteinPerServing || "");
  const [carbs, setCarbs] = useState(prefill?.carbsPerServing || "");
  const [fat, setFat] = useState(prefill?.fatPerServing || "");

  const [ingredients, setIngredients] = useState<IngredientRow[]>(() => {
    if (prefill?.ingredients?.length) {
      return prefill.ingredients.map((ing) => ({
        key: nextIngredientKey(),
        name: ing.name,
        quantity: ing.quantity || "",
        unit: ing.unit || "",
      }));
    }
    return [{ key: nextIngredientKey(), name: "", quantity: "", unit: "" }];
  });

  const handleToggleDietTag = useCallback(
    (tag: string) => {
      haptics.selection();
      setSelectedDietTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
      );
    },
    [haptics],
  );

  const handleAddIngredient = useCallback(() => {
    haptics.selection();
    setIngredients((prev) => [
      ...prev,
      { key: nextIngredientKey(), name: "", quantity: "", unit: "" },
    ]);
  }, [haptics]);

  const handleRemoveIngredient = useCallback(
    (key: string) => {
      haptics.selection();
      setIngredients((prev) => prev.filter((i) => i.key !== key));
    },
    [haptics],
  );

  const handleUpdateIngredient = useCallback(
    (key: string, field: keyof IngredientRow, value: string) => {
      setIngredients((prev) =>
        prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)),
      );
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter a recipe title.");
      return;
    }

    haptics.notification(Haptics.NotificationFeedbackType.Success);

    const validIngredients = ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        quantity: i.quantity || null,
        unit: i.unit || null,
      }));

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        servings: parseInt(servings, 10) || 2,
        prepTimeMinutes: prepTime ? parseInt(prepTime, 10) : null,
        cookTimeMinutes: cookTime ? parseInt(cookTime, 10) : null,
        cuisine: cuisine.trim() || null,
        dietTags: selectedDietTags,
        instructions: instructions.trim() || null,
        caloriesPerServing: calories || null,
        proteinPerServing: protein || null,
        carbsPerServing: carbs || null,
        fatPerServing: fat || null,
        ingredients: validIngredients,
      });
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Failed to save recipe. Please try again.");
    }
  }, [
    title,
    description,
    servings,
    prepTime,
    cookTime,
    cuisine,
    selectedDietTags,
    instructions,
    calories,
    protein,
    carbs,
    fat,
    ingredients,
    haptics,
    createMutation,
    navigation,
  ]);

  const inputStyle = [
    styles.textInput,
    {
      backgroundColor: withOpacity(theme.text, 0.04),
      color: theme.text,
      borderColor: withOpacity(theme.text, 0.1),
    },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.sm,
          paddingBottom: insets.bottom + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <FormField label="Title *">
          <TextInput
            style={inputStyle}
            value={title}
            onChangeText={setTitle}
            placeholder="Recipe name"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Recipe title"
          />
        </FormField>

        {/* Description */}
        <FormField label="Description">
          <TextInput
            style={[...inputStyle, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            accessibilityLabel="Recipe description"
          />
        </FormField>

        {/* Time & Servings Row */}
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <FormField label="Servings">
              <TextInput
                style={inputStyle}
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
                placeholder="2"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Servings"
              />
            </FormField>
          </View>
          <View style={styles.rowItem}>
            <FormField label="Prep (min)">
              <TextInput
                style={inputStyle}
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="numeric"
                placeholder="15"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Prep time in minutes"
              />
            </FormField>
          </View>
          <View style={styles.rowItem}>
            <FormField label="Cook (min)">
              <TextInput
                style={inputStyle}
                value={cookTime}
                onChangeText={setCookTime}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Cook time in minutes"
              />
            </FormField>
          </View>
        </View>

        {/* Cuisine */}
        <FormField label="Cuisine">
          <TextInput
            style={inputStyle}
            value={cuisine}
            onChangeText={setCuisine}
            placeholder="e.g., Italian"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Cuisine"
          />
        </FormField>

        {/* Diet Tags */}
        <FormField label="Diet Tags">
          <View style={styles.tagGrid}>
            {DIET_TAG_OPTIONS.map((tag) => {
              const active = selectedDietTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => handleToggleDietTag(tag)}
                  style={[
                    styles.dietTag,
                    {
                      backgroundColor: active
                        ? withOpacity(theme.link, 0.15)
                        : withOpacity(theme.text, 0.04),
                      borderColor: active
                        ? theme.link
                        : withOpacity(theme.text, 0.1),
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${active ? "Remove" : "Add"} ${tag} diet tag`}
                  accessibilityState={{ selected: active }}
                >
                  <ThemedText
                    style={[
                      styles.dietTagText,
                      { color: active ? theme.link : theme.textSecondary },
                    ]}
                  >
                    {tag}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </FormField>

        {/* Ingredients */}
        <FormField label="Ingredients">
          {ingredients.map((ing) => (
            <View key={ing.key} style={styles.ingredientRow}>
              <TextInput
                style={[...inputStyle, styles.ingredientName]}
                value={ing.name}
                onChangeText={(v) => handleUpdateIngredient(ing.key, "name", v)}
                placeholder="Name"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Ingredient name"
              />
              <TextInput
                style={[...inputStyle, styles.ingredientQty]}
                value={ing.quantity}
                onChangeText={(v) =>
                  handleUpdateIngredient(ing.key, "quantity", v)
                }
                placeholder="Qty"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                accessibilityLabel="Ingredient quantity"
              />
              <TextInput
                style={[...inputStyle, styles.ingredientUnit]}
                value={ing.unit}
                onChangeText={(v) => handleUpdateIngredient(ing.key, "unit", v)}
                placeholder="Unit"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Ingredient unit"
              />
              {ingredients.length > 1 && (
                <Pressable
                  onPress={() => handleRemoveIngredient(ing.key)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ingredient ${ing.name || ""}`}
                >
                  <Feather name="x" size={16} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>
          ))}
          <Pressable
            onPress={handleAddIngredient}
            style={[
              styles.addIngredientButton,
              { borderColor: withOpacity(theme.text, 0.1) },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add ingredient"
          >
            <Feather name="plus" size={14} color={theme.link} />
            <ThemedText
              style={[styles.addIngredientText, { color: theme.link }]}
            >
              Add ingredient
            </ThemedText>
          </Pressable>
        </FormField>

        {/* Nutrition */}
        <FormField label="Nutrition per Serving">
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <TextInput
                style={inputStyle}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholder="Cal"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Calories"
              />
            </View>
            <View style={styles.rowItem}>
              <TextInput
                style={inputStyle}
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                placeholder="Protein"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Protein in grams"
              />
            </View>
            <View style={styles.rowItem}>
              <TextInput
                style={inputStyle}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                placeholder="Carbs"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Carbs in grams"
              />
            </View>
            <View style={styles.rowItem}>
              <TextInput
                style={inputStyle}
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
                placeholder="Fat"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Fat in grams"
              />
            </View>
          </View>
        </FormField>

        {/* Instructions */}
        <FormField label="Instructions">
          <TextInput
            style={[...inputStyle, styles.instructionsInput]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Step-by-step cooking instructions..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            accessibilityLabel="Cooking instructions"
          />
        </FormField>
      </ScrollView>

      {/* Save Button */}
      <View
        style={[
          styles.saveBar,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: theme.backgroundRoot,
            borderTopColor: withOpacity(theme.text, 0.08),
          },
        ]}
      >
        <Pressable
          onPress={handleSave}
          disabled={createMutation.isPending}
          style={[
            styles.saveButton,
            {
              backgroundColor: createMutation.isPending
                ? withOpacity(theme.link, 0.5)
                : theme.link,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save recipe"
        >
          <ThemedText style={styles.saveButtonText}>
            {createMutation.isPending ? "Saving..." : "Save Recipe"}
          </ThemedText>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formField: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  instructionsInput: {
    minHeight: 120,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  dietTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
  },
  dietTagText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  ingredientName: {
    flex: 3,
  },
  ingredientQty: {
    flex: 1,
  },
  ingredientUnit: {
    flex: 1.5,
  },
  addIngredientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  addIngredientText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  saveBar: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.card,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
});
