import React from "react";
import { StyleSheet, View, Modal, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import { Spacing, BorderRadius, withOpacity } from "@/constants/theme";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  /** Callback for when purchase flow completes — wire to expo-iap in future */
  onUpgrade?: () => void;
}

const BENEFITS = [
  { icon: "zap" as const, label: "Unlimited daily scans" },
  { icon: "bar-chart-2" as const, label: "Detailed macro goals" },
  { icon: "book-open" as const, label: "AI recipe generation" },
  { icon: "camera" as const, label: "High quality photo capture" },
];

export function UpgradeModal({
  visible,
  onClose,
  onUpgrade,
}: UpgradeModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const accentColor = theme.success;

  const handleUpgrade = () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Wire to expo-iap purchase flow
    onUpgrade?.();
    onClose();
  };

  const handleRestore = () => {
    haptics.impact(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Wire to expo-iap restore purchases
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.backgroundDefault,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          {/* Close button */}
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close upgrade modal"
            accessibilityRole="button"
            hitSlop={12}
            style={styles.closeButton}
          >
            <Feather name="x" size={24} color={theme.textSecondary} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: withOpacity(accentColor, 0.12) },
              ]}
            >
              <Feather name="star" size={32} color={accentColor} />
            </View>
            <ThemedText type="h3" style={styles.title}>
              Upgrade to Premium
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              Unlock the full NutriScan experience
            </ThemedText>

            {/* Benefits */}
            <Card elevation={1} style={styles.benefitsCard}>
              {BENEFITS.map((benefit, index) => (
                <View
                  key={benefit.label}
                  style={[
                    styles.benefitRow,
                    index < BENEFITS.length - 1 && styles.benefitRowBorder,
                    index < BENEFITS.length - 1 && {
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.benefitIcon,
                      { backgroundColor: withOpacity(accentColor, 0.12) },
                    ]}
                  >
                    <Feather
                      name={benefit.icon}
                      size={18}
                      color={accentColor}
                    />
                  </View>
                  <ThemedText type="body" style={styles.benefitLabel}>
                    {benefit.label}
                  </ThemedText>
                  <Feather name="check" size={18} color={accentColor} />
                </View>
              ))}
            </Card>

            {/* CTA */}
            <Pressable
              onPress={handleUpgrade}
              accessibilityLabel="Start 3-day free trial"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.ctaButton,
                { backgroundColor: accentColor, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <ThemedText
                type="body"
                style={[styles.ctaText, { color: theme.buttonText }]}
              >
                Start 3-Day Free Trial
              </ThemedText>
            </Pressable>

            {/* Restore */}
            <Pressable
              onPress={handleRestore}
              accessibilityLabel="Restore purchases"
              accessibilityRole="button"
              style={styles.restoreButton}
            >
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Restore Purchases
              </ThemedText>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    maxHeight: "85%",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: Spacing.xs,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: Spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  benefitsCard: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  benefitRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  benefitLabel: {
    flex: 1,
  },
  ctaButton: {
    width: "100%",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  ctaText: {
    fontWeight: "600",
  },
  restoreButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    justifyContent: "center",
  },
});
