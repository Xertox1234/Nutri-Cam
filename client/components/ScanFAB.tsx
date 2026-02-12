import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import { BorderRadius, Shadows } from "@/constants/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

/** Must match the tab bar height set in MainTabNavigator screenOptions */
const TAB_BAR_HEIGHT = Platform.select({ ios: 88, android: 72 }) ?? 88;

export function ScanFAB() {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Scan");
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Scan food item"
      style={[
        styles.fab,
        Shadows.medium,
        {
          backgroundColor: theme.link,
          bottom: TAB_BAR_HEIGHT + 16,
        },
      ]}
    >
      <Feather name="plus" size={28} color={theme.buttonText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
});
