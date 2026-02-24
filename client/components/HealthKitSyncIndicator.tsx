import React from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import type { HealthKitSyncSetting } from "@/hooks/useHealthKit";
import {
  Spacing,
  BorderRadius,
  FontFamily,
  withOpacity,
} from "@/constants/theme";

interface HealthKitSyncIndicatorProps {
  settings: HealthKitSyncSetting[];
}

function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours === 1) return "1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export const HealthKitSyncIndicator = React.memo(
  function HealthKitSyncIndicator({ settings }: HealthKitSyncIndicatorProps) {
    const { theme } = useTheme();

    const enabledSettings = settings.filter((s) => s.enabled);
    if (enabledSettings.length === 0) return null;

    // Find the most recent sync across all enabled types
    const lastSync = enabledSettings
      .filter((s) => s.lastSyncAt)
      .sort(
        (a, b) =>
          new Date(b.lastSyncAt!).getTime() - new Date(a.lastSyncAt!).getTime(),
      )[0]?.lastSyncAt;

    const isSynced = !!lastSync;
    const isRecent =
      isSynced &&
      Date.now() - new Date(lastSync).getTime() < 24 * 60 * 60 * 1000;
    const dotColor = isRecent ? theme.success : theme.warning;
    const label = isSynced ? `Synced ${formatTimeAgo(lastSync)}` : "Not synced";

    return (
      <View
        style={[styles.badge, { backgroundColor: withOpacity(dotColor, 0.1) }]}
        accessibilityLabel={`Apple Health sync status: ${label}`}
        accessibilityRole="text"
      >
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <ThemedText style={[styles.text, { color: dotColor }]}>
          {label}
        </ThemedText>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.chip,
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  text: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    fontWeight: "600",
  },
});
