import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuthContext } from "@/context/AuthContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface DailySummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  itemCount: number;
}

function SettingsItem({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  danger = false,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsItem,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View
        style={[
          styles.settingsIcon,
          {
            backgroundColor: danger
              ? Colors.light.error + "20"
              : theme.backgroundSecondary,
          },
        ]}
      >
        <Feather
          name={icon as any}
          size={20}
          color={danger ? Colors.light.error : theme.text}
        />
      </View>
      <View style={styles.settingsContent}>
        <ThemedText
          type="body"
          style={[danger && { color: Colors.light.error }]}
        >
          {label}
        </ThemedText>
        {value ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {value}
          </ThemedText>
        ) : null}
      </View>
      {showChevron ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, logout, updateUser } = useAuthContext();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [calorieGoal, setCalorieGoal] = useState(
    (user?.dailyCalorieGoal || 2000).toString()
  );
  const [isSaving, setIsSaving] = useState(false);

  const { data: todaySummary } = useQuery<DailySummary>({
    queryKey: ["/api/daily-summary"],
    enabled: !!user,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUser({
        displayName: displayName.trim() || undefined,
        dailyCalorieGoal: parseInt(calorieGoal) || 2000,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
  };

  const calorieProgress = todaySummary
    ? Math.min(
        (todaySummary.totalCalories / (user?.dailyCalorieGoal || 2000)) * 100,
        100
      )
    : 0;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.profileHeader}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: Colors.light.success + "20" },
          ]}
        >
          <Feather name="user" size={40} color={Colors.light.success} />
        </View>

        {isEditing ? (
          <TextInput
            style={[
              styles.nameInput,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display Name"
            placeholderTextColor={theme.textSecondary}
            autoFocus
          />
        ) : (
          <ThemedText type="h3" style={styles.userName}>
            {user?.displayName || user?.username || "User"}
          </ThemedText>
        )}

        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          @{user?.username}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Card elevation={1} style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <ThemedText type="h4">Today's Progress</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {todaySummary?.itemCount || 0} items logged
            </ThemedText>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.calorieInfo}>
              <ThemedText
                type="h2"
                style={{ color: Colors.light.calorieAccent }}
              >
                {todaySummary?.totalCalories
                  ? Math.round(todaySummary.totalCalories)
                  : 0}
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                / {user?.dailyCalorieGoal || 2000} kcal
              </ThemedText>
            </View>

            <View
              style={[
                styles.progressBar,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${calorieProgress}%`,
                    backgroundColor: Colors.light.calorieAccent,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.macrosSummary}>
            <View style={styles.macroSummaryItem}>
              <ThemedText type="h4" style={{ color: Colors.light.proteinAccent }}>
                {todaySummary?.totalProtein
                  ? Math.round(todaySummary.totalProtein)
                  : 0}
                g
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Protein
              </ThemedText>
            </View>
            <View style={styles.macroSummaryItem}>
              <ThemedText type="h4" style={{ color: Colors.light.carbsAccent }}>
                {todaySummary?.totalCarbs
                  ? Math.round(todaySummary.totalCarbs)
                  : 0}
                g
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Carbs
              </ThemedText>
            </View>
            <View style={styles.macroSummaryItem}>
              <ThemedText type="h4" style={{ color: Colors.light.fatAccent }}>
                {todaySummary?.totalFat
                  ? Math.round(todaySummary.totalFat)
                  : 0}
                g
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Fat
              </ThemedText>
            </View>
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Nutrition Goals
        </ThemedText>
        <Card elevation={1} style={styles.settingsCard}>
          <View style={styles.goalRow}>
            <ThemedText type="body">Daily Calorie Target</ThemedText>
            {isEditing ? (
              <TextInput
                style={[
                  styles.goalInput,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                  },
                ]}
                value={calorieGoal}
                onChangeText={setCalorieGoal}
                keyboardType="numeric"
                maxLength={5}
              />
            ) : (
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {user?.dailyCalorieGoal || 2000} kcal
              </ThemedText>
            )}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Account
        </ThemedText>
        <Card elevation={1} style={styles.settingsCard}>
          {isEditing ? (
            <View style={styles.editButtons}>
              <Button
                onPress={handleSave}
                disabled={isSaving}
                style={{ flex: 1, backgroundColor: Colors.light.success }}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Pressable
                onPress={() => setIsEditing(false)}
                style={[
                  styles.cancelButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              <SettingsItem
                icon="edit-2"
                label="Edit Profile"
                onPress={() => setIsEditing(true)}
              />
              <View style={styles.divider} />
              <SettingsItem
                icon="log-out"
                label="Sign Out"
                onPress={handleLogout}
                showChevron={false}
                danger
              />
            </>
          )}
        </Card>
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  userName: {
    marginBottom: Spacing.xs,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.xs,
    minWidth: 200,
  },
  todayCard: {
    padding: Spacing.xl,
    marginBottom: Spacing["2xl"],
  },
  todayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  calorieInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  macrosSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  macroSummaryItem: {
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  settingsCard: {
    padding: 0,
    marginBottom: Spacing["2xl"],
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginLeft: Spacing.lg + 40 + Spacing.md,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  goalInput: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    minWidth: 100,
    textAlign: "right",
  },
  editButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  cancelButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
});
