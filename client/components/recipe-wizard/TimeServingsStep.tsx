import React from "react";
import { View, Text } from "react-native";
import type { TimeServingsData } from "@/hooks/useRecipeForm";

interface TimeServingsStepProps {
  timeServings: TimeServingsData;
  setTimeServings: (data: TimeServingsData) => void;
}

export default function TimeServingsStep(_props: TimeServingsStepProps) {
  return (
    <View>
      <Text>TimeServingsStep - placeholder</Text>
    </View>
  );
}
