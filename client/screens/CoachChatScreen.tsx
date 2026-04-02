import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { CoachOverlayContent } from "@/components/CoachOverlayContent";

type Props = NativeStackScreenProps<RootStackParamList, "CoachChat">;

export default function CoachChatScreen({ navigation, route }: Props) {
  const { question, questionText, screenContext } = route.params;

  return (
    <CoachOverlayContent
      question={{ text: questionText, question }}
      screenContext={screenContext ?? ""}
      onDismiss={() => navigation.goBack()}
    />
  );
}
