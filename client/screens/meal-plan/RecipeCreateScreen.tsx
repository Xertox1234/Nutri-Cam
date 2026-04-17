import React, { useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { MealPlanStackParamList } from "@/navigation/MealPlanStackNavigator";
import WizardShell from "@/components/recipe-wizard/WizardShell";

type RecipeCreateScreenNavigationProp = NativeStackNavigationProp<
  MealPlanStackParamList,
  "RecipeCreate"
>;

type RecipeCreateRouteProp = RouteProp<MealPlanStackParamList, "RecipeCreate">;

export default function RecipeCreateScreen() {
  const navigation = useNavigation<RecipeCreateScreenNavigationProp>();
  const route = useRoute<RecipeCreateRouteProp>();
  const { prefill, returnToMealPlan } = route.params ?? {};

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSaveComplete = useCallback(() => {
    if (returnToMealPlan) {
      navigation.popToTop();
    } else {
      navigation.goBack();
    }
  }, [navigation, returnToMealPlan]);

  return (
    <WizardShell
      prefill={prefill}
      returnToMealPlan={returnToMealPlan}
      onGoBack={handleGoBack}
      onSaveComplete={handleSaveComplete}
    />
  );
}
