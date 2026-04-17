import React from "react";
import { View, Text } from "react-native";
import type { NutritionData } from "@/hooks/useRecipeForm";

interface NutritionStepProps {
  nutrition: NutritionData;
  setNutrition: (data: NutritionData) => void;
}

export default function NutritionStep(_props: NutritionStepProps) {
  return (
    <View>
      <Text>NutritionStep - placeholder</Text>
    </View>
  );
}
