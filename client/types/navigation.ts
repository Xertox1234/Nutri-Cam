import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

// Re-export types from navigation files for convenience
export type { RootStackParamList } from "@/navigation/RootStackNavigator";
export type { MainTabParamList } from "@/navigation/MainTabNavigator";
export type { HistoryStackParamList } from "@/navigation/HistoryStackNavigator";
export type { ScanStackParamList } from "@/navigation/ScanStackNavigator";

// Import the param lists for use in composite types
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";
import type { HistoryStackParamList } from "@/navigation/HistoryStackNavigator";
import type { ScanStackParamList } from "@/navigation/ScanStackNavigator";

/**
 * Navigation prop for HistoryScreen
 * Can navigate to ItemDetail within the history stack
 */
export type HistoryScreenNavigationProp = NativeStackNavigationProp<
  HistoryStackParamList,
  "History"
>;

/**
 * Navigation prop for ScanScreen
 * Uses CompositeNavigationProp to navigate across stacks:
 * - Navigate to NutritionDetail (RootStack)
 * - Navigate to HistoryTab (MainTab)
 */
export type ScanScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ScanStackParamList, "Scan">,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >
>;

/**
 * Navigation prop for NutritionDetailScreen
 * Can use goBack or navigate within RootStack
 */
export type NutritionDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "NutritionDetail"
>;
