import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import {
  Spacing,
  BorderRadius,
  FontFamily,
  withOpacity,
} from "@/constants/theme";
import {
  FASTING_PROTOCOLS,
  resolveFastingSchedule,
  isValidFastingHours,
} from "./fasting-setup-utils";

interface FastingSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    protocol: string;
    fastingHours: number;
    eatingHours: number;
    eatingWindowStart?: string;
    eatingWindowEnd?: string;
    notifyEatingWindow: boolean;
    notifyMilestones: boolean;
    notifyCheckIns: boolean;
  }) => void;
  isPending?: boolean;
  initialProtocol?: string;
  initialFastingHours?: number;
  initialEatingWindowStart?: string;
  initialEatingWindowEnd?: string;
  initialNotifyEatingWindow?: boolean;
  initialNotifyMilestones?: boolean;
  initialNotifyCheckIns?: boolean;
}

export function FastingSetupModal({
  visible,
  onClose,
  onSave,
  isPending,
  initialProtocol = "16:8",
  initialFastingHours = 16,
  initialEatingWindowStart = "12:00",
  initialEatingWindowEnd = "20:00",
  initialNotifyEatingWindow = true,
  initialNotifyMilestones = true,
  initialNotifyCheckIns = true,
}: FastingSetupModalProps) {
  const { theme, isDark } = useTheme();
  const haptics = useHaptics();

  const [protocol, setProtocol] = useState(initialProtocol);
  const [customHours, setCustomHours] = useState(String(initialFastingHours));
  const [windowStart, setWindowStart] = useState(initialEatingWindowStart);
  const [windowEnd, setWindowEnd] = useState(initialEatingWindowEnd);
  const [notifyEatingWindow, setNotifyEatingWindow] = useState(
    initialNotifyEatingWindow,
  );
  const [notifyMilestones, setNotifyMilestones] = useState(
    initialNotifyMilestones,
  );
  const [notifyCheckIns, setNotifyCheckIns] = useState(initialNotifyCheckIns);

  const isCustom = protocol === "custom";
  const { fastingHours, eatingHours } = resolveFastingSchedule(
    protocol,
    customHours,
  );

  const handleSave = useCallback(() => {
    if (!isValidFastingHours(fastingHours)) return;
    haptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    onSave({
      protocol,
      fastingHours,
      eatingHours,
      eatingWindowStart: windowStart || undefined,
      eatingWindowEnd: windowEnd || undefined,
      notifyEatingWindow,
      notifyMilestones,
      notifyCheckIns,
    });
  }, [
    protocol,
    fastingHours,
    eatingHours,
    windowStart,
    windowEnd,
    notifyEatingWindow,
    notifyMilestones,
    notifyCheckIns,
    haptics,
    onSave,
  ]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        accessibilityViewIsModal
      >
        <ScrollView
          style={[
            styles.modalContainer,
            { backgroundColor: theme.backgroundRoot },
          ]}
          contentContainerStyle={styles.modalContent}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <ThemedText type="h3">Fasting Schedule</ThemedText>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={12}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          {/* Protocol Picker */}
          <ThemedText type="h4" style={styles.sectionLabel}>
            Protocol
          </ThemedText>
          <View
            style={styles.protocolGrid}
            accessibilityRole="radiogroup"
            accessibilityLabel="Fasting protocol"
          >
            {FASTING_PROTOCOLS.map((p) => {
              const isSelected = protocol === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => {
                    haptics.selection();
                    setProtocol(p.key);
                  }}
                  accessibilityLabel={`${p.label} protocol`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.protocolChip,
                    {
                      backgroundColor: isSelected
                        ? theme.link
                        : theme.backgroundSecondary,
                      borderColor: isSelected ? theme.link : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.protocolLabel,
                      {
                        color: isSelected ? theme.buttonText : theme.text,
                      },
                    ]}
                  >
                    {p.label}
                  </ThemedText>
                  {p.key !== "custom" && (
                    <ThemedText
                      type="caption"
                      style={{
                        color: isSelected
                          ? withOpacity(theme.buttonText, 0.8)
                          : theme.textSecondary,
                      }}
                    >
                      {p.fastingHours}h fast / {p.eatingHours}h eat
                    </ThemedText>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Custom Hours Input */}
          {isCustom && (
            <View style={styles.customSection}>
              <ThemedText type="small" style={styles.fieldLabel}>
                Fasting hours (1-23)
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="16"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                value={customHours}
                onChangeText={setCustomHours}
                accessibilityLabel="Custom fasting hours"
                maxLength={2}
              />
              {fastingHours >= 1 && fastingHours <= 23 && (
                <ThemedText
                  type="caption"
                  style={[styles.summaryText, { color: theme.textSecondary }]}
                >
                  {fastingHours}h fasting / {eatingHours}h eating window
                </ThemedText>
              )}
            </View>
          )}

          {/* Eating Window Times */}
          <ThemedText type="h4" style={styles.sectionLabel}>
            Eating Window
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.helpText, { color: theme.textSecondary }]}
          >
            Optional: set your preferred eating window times (HH:MM)
          </ThemedText>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Start
              </ThemedText>
              <TextInput
                style={[
                  styles.timeInput,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="12:00"
                placeholderTextColor={theme.textSecondary}
                value={windowStart}
                onChangeText={setWindowStart}
                accessibilityLabel="Eating window start time"
                maxLength={5}
              />
            </View>
            <Feather
              name="arrow-right"
              size={20}
              color={theme.textSecondary}
              style={styles.timeArrow}
            />
            <View style={styles.timeField}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                End
              </ThemedText>
              <TextInput
                style={[
                  styles.timeInput,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="20:00"
                placeholderTextColor={theme.textSecondary}
                value={windowEnd}
                onChangeText={setWindowEnd}
                accessibilityLabel="Eating window end time"
                maxLength={5}
              />
            </View>
          </View>

          {/* Schedule Summary */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: withOpacity(theme.link, isDark ? 0.15 : 0.08),
                borderColor: withOpacity(theme.link, 0.2),
              },
            ]}
          >
            <Feather name="clock" size={20} color={theme.link} />
            <View style={styles.summaryContent}>
              <ThemedText style={styles.summaryTitle}>
                {fastingHours}:{eatingHours} Schedule
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Fast for {fastingHours} hours, eat within {eatingHours} hours
                {windowStart && windowEnd
                  ? ` (${windowStart} - ${windowEnd})`
                  : ""}
              </ThemedText>
            </View>
          </View>

          {/* Notification Settings */}
          <ThemedText type="h4" style={styles.sectionLabel}>
            Notifications
          </ThemedText>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <ThemedText style={styles.toggleTitle}>
                Eating window reminders
              </ThemedText>
              {!windowStart && (
                <ThemedText
                  type="caption"
                  style={{ color: theme.textSecondary }}
                >
                  Set eating window times to enable
                </ThemedText>
              )}
            </View>
            <Switch
              value={notifyEatingWindow && !!windowStart}
              onValueChange={(v) => {
                haptics.selection();
                setNotifyEatingWindow(v);
              }}
              disabled={!windowStart}
              accessibilityRole="switch"
              accessibilityLabel="Eating window reminders"
              accessibilityState={{
                checked: notifyEatingWindow && !!windowStart,
                disabled: !windowStart,
              }}
              accessibilityHint={
                !windowStart ? "Set eating window times to enable" : undefined
              }
            />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <ThemedText style={styles.toggleTitle}>
                Milestone encouragements
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Notifications at 12h, 16h, 20h, 24h marks
              </ThemedText>
            </View>
            <Switch
              value={notifyMilestones}
              onValueChange={(v) => {
                haptics.selection();
                setNotifyMilestones(v);
              }}
              accessibilityRole="switch"
              accessibilityLabel="Milestone encouragements"
              accessibilityState={{ checked: notifyMilestones }}
            />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <ThemedText style={styles.toggleTitle}>
                Supportive check-ins
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Periodic encouragement during long fasts
              </ThemedText>
            </View>
            <Switch
              value={notifyCheckIns}
              onValueChange={(v) => {
                haptics.selection();
                setNotifyCheckIns(v);
              }}
              accessibilityRole="switch"
              accessibilityLabel="Supportive check-ins"
              accessibilityState={{ checked: notifyCheckIns }}
            />
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={isPending || !isValidFastingHours(fastingHours)}
            accessibilityLabel="Save fasting schedule"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: theme.link,
                opacity:
                  pressed || isPending || !isValidFastingHours(fastingHours)
                    ? 0.6
                    : 1,
              },
            ]}
          >
            <ThemedText
              style={[styles.saveButtonText, { color: theme.buttonText }]}
            >
              {isPending ? "Saving..." : "Save Schedule"}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    padding: Spacing.xl,
    paddingTop: Spacing["3xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  protocolGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  protocolChip: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  protocolLabel: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    fontWeight: "600",
  },
  customSection: {
    marginTop: Spacing.md,
  },
  fieldLabel: {
    marginBottom: Spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    fontSize: 18,
    fontFamily: FontFamily.medium,
    borderWidth: 1,
    textAlign: "center",
  },
  summaryText: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  helpText: {
    marginBottom: Spacing.md,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  timeField: {
    flex: 1,
    gap: Spacing.xs,
  },
  timeInput: {
    height: 48,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    borderWidth: 1,
    textAlign: "center",
  },
  timeArrow: {
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    marginTop: Spacing["2xl"],
    gap: Spacing.md,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    fontWeight: "600",
    marginBottom: 2,
  },
  saveButton: {
    height: 52,
    borderRadius: BorderRadius.button,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  toggleLabel: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleTitle: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: "500",
  },
});
