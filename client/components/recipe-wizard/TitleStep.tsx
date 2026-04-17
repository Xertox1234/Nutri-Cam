import React from "react";
import { View, Text } from "react-native";

interface TitleStepProps {
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
}

export default function TitleStep(_props: TitleStepProps) {
  return (
    <View>
      <Text>TitleStep - placeholder</Text>
    </View>
  );
}
