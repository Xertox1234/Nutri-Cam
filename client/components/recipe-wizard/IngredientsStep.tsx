import React from "react";
import { View, Text } from "react-native";
import type { IngredientRow } from "@/hooks/useRecipeForm";

interface IngredientsStepProps {
  ingredients: IngredientRow[];
  addIngredient: () => void;
  removeIngredient: (key: string) => void;
  updateIngredient: (key: string, text: string) => void;
}

export default function IngredientsStep(_props: IngredientsStepProps) {
  return (
    <View>
      <Text>IngredientsStep - placeholder</Text>
    </View>
  );
}
