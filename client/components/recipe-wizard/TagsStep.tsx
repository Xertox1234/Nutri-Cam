import React from "react";
import { View, Text } from "react-native";
import type { TagsData } from "@/hooks/useRecipeForm";

interface TagsStepProps {
  tags: TagsData;
  setTags: (data: TagsData) => void;
}

export default function TagsStep(_props: TagsStepProps) {
  return (
    <View>
      <Text>TagsStep - placeholder</Text>
    </View>
  );
}
