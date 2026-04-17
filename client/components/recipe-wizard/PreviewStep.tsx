import React from "react";
import { View, Text } from "react-native";
import type { useRecipeForm } from "@/hooks/useRecipeForm";
import type { WizardStep } from "./types";

interface PreviewStepProps {
  form: ReturnType<typeof useRecipeForm>;
  onEditStep: (step: WizardStep) => void;
}

export default function PreviewStep(_props: PreviewStepProps) {
  return (
    <View>
      <Text>PreviewStep - placeholder</Text>
    </View>
  );
}
