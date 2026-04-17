import React from "react";
import { View, Text } from "react-native";
import type { StepRow } from "@/hooks/useRecipeForm";

interface InstructionsStepProps {
  steps: StepRow[];
  addStep: () => void;
  removeStep: (key: string) => void;
  updateStep: (key: string, text: string) => void;
  moveStep: (key: string, direction: "up" | "down") => void;
}

export default function InstructionsStep(_props: InstructionsStepProps) {
  return (
    <View>
      <Text>InstructionsStep - placeholder</Text>
    </View>
  );
}
