/**
 * Pure data and calculation utilities for FastingSetupModal.
 * Extracted for testability — no React or RN dependencies.
 */

export interface FastingProtocol {
  key: string;
  label: string;
  fastingHours: number;
  eatingHours: number;
}

export const FASTING_PROTOCOLS: readonly FastingProtocol[] = [
  { key: "16:8", label: "16:8", fastingHours: 16, eatingHours: 8 },
  { key: "18:6", label: "18:6", fastingHours: 18, eatingHours: 6 },
  { key: "20:4", label: "20:4", fastingHours: 20, eatingHours: 4 },
  { key: "custom", label: "Custom", fastingHours: 0, eatingHours: 0 },
];

/** Resolve the fasting/eating hours for a given protocol and custom input. */
export function resolveFastingSchedule(
  protocol: string,
  customHoursInput: string,
): { fastingHours: number; eatingHours: number } {
  const preset = FASTING_PROTOCOLS.find((p) => p.key === protocol);
  const isCustom = protocol === "custom";

  const fastingHours = isCustom
    ? parseInt(customHoursInput, 10) || 16
    : (preset?.fastingHours ?? 16);
  const eatingHours = isCustom ? 24 - fastingHours : (preset?.eatingHours ?? 8);

  return { fastingHours, eatingHours };
}

/** Check if fasting hours are within the valid range (1-23). */
export function isValidFastingHours(hours: number): boolean {
  return Number.isInteger(hours) && hours >= 1 && hours <= 23;
}
