import { usePremiumContext } from "@/context/PremiumContext";
import type { PremiumFeatureKey } from "@shared/types/premium";
import { ALL_BARCODE_TYPES, type ExpoBarcodeType } from "@shared/types/camera";

/**
 * Check if a specific premium feature is enabled for the current user.
 */
export function usePremiumFeature(featureKey: PremiumFeatureKey): boolean {
  const { features } = usePremiumContext();

  const value = features[featureKey];
  if (typeof value === "boolean") {
    return value;
  }

  // For numeric features like maxDailyScans, consider them "enabled" if > 0
  return value > 0;
}

/**
 * Get all barcode types (no tier restrictions - all types free).
 */
export function useAvailableBarcodeTypes(): ExpoBarcodeType[] {
  return ALL_BARCODE_TYPES;
}

/**
 * Check if the user can perform a scan today (based on daily limits).
 */
export function useCanScanToday(): {
  canScan: boolean;
  remainingScans: number | null;
  dailyLimit: number;
  currentCount: number;
} {
  const { features, isPremium, dailyScanCount, canScanToday } =
    usePremiumContext();

  const dailyLimit = features.maxDailyScans;
  const remainingScans = isPremium
    ? null
    : Math.max(0, dailyLimit - dailyScanCount);

  return {
    canScan: canScanToday,
    remainingScans,
    dailyLimit,
    currentCount: dailyScanCount,
  };
}

/**
 * Combined hook for all premium camera features.
 */
export function usePremiumCamera(): {
  availableBarcodeTypes: ExpoBarcodeType[];
  canScan: boolean;
  remainingScans: number | null;
  isPremium: boolean;
  videoRecording: boolean;
} {
  const { features, isPremium, dailyScanCount, canScanToday } =
    usePremiumContext();

  const dailyLimit = features.maxDailyScans;
  const remainingScans = isPremium
    ? null
    : Math.max(0, dailyLimit - dailyScanCount);

  return {
    availableBarcodeTypes: ALL_BARCODE_TYPES,
    canScan: canScanToday,
    remainingScans,
    isPremium,
    videoRecording: features.videoRecording,
  };
}
