import {
  TIER_FEATURES,
  UNLIMITED_SCANS,
  type SubscriptionTier,
} from "@shared/types/premium";
import { ALL_BARCODE_TYPES } from "@shared/types/camera";

// Import hooks after mocking
import {
  usePremiumFeature,
  useAvailableBarcodeTypes,
  useCanScanToday,
  usePremiumCamera,
} from "../usePremiumFeatures";

// Mock the PremiumContext module
const mockUsePremiumContext = vi.fn();
vi.mock("@/context/PremiumContext", () => ({
  usePremiumContext: () => mockUsePremiumContext(),
}));

describe("usePremiumFeatures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("usePremiumFeature", () => {
    it("should return true for enabled boolean features", () => {
      mockUsePremiumContext.mockReturnValue({
        features: TIER_FEATURES.premium,
      });

      expect(usePremiumFeature("videoRecording")).toBe(true);
    });

    it("should return false for disabled boolean features", () => {
      mockUsePremiumContext.mockReturnValue({
        features: TIER_FEATURES.free,
      });

      expect(usePremiumFeature("videoRecording")).toBe(false);
    });

    it("should return true for numeric features > 0", () => {
      mockUsePremiumContext.mockReturnValue({
        features: { ...TIER_FEATURES.free, maxDailyScans: 3 },
      });

      expect(usePremiumFeature("maxDailyScans")).toBe(true);
    });

    it("should return true for unlimited maxDailyScans (premium)", () => {
      mockUsePremiumContext.mockReturnValue({
        features: TIER_FEATURES.premium,
      });

      expect(usePremiumFeature("maxDailyScans")).toBe(true);
    });
  });

  describe("useAvailableBarcodeTypes", () => {
    it("should return all barcode types (no tier restrictions)", () => {
      const types = useAvailableBarcodeTypes();

      expect(types).toEqual(ALL_BARCODE_TYPES);
      expect(types).toContain("qr");
      expect(types).toContain("datamatrix");
      expect(types).toContain("ean13");
    });
  });

  describe("useCanScanToday", () => {
    it("should return canScan true when under limit", () => {
      mockUsePremiumContext.mockReturnValue({
        features: TIER_FEATURES.free,
        isPremium: false,
        dailyScanCount: 2,
        canScanToday: true,
      });

      const result = useCanScanToday();

      expect(result.canScan).toBe(true);
      expect(result.remainingScans).toBe(1); // 3 - 2
      expect(result.dailyLimit).toBe(3);
      expect(result.currentCount).toBe(2);
    });

    it("should return canScan false when at limit", () => {
      mockUsePremiumContext.mockReturnValue({
        features: TIER_FEATURES.free,
        isPremium: false,
        dailyScanCount: 3,
        canScanToday: false,
      });

      const result = useCanScanToday();

      expect(result.canScan).toBe(false);
      expect(result.remainingScans).toBe(0);
      expect(result.currentCount).toBe(3);
    });

    it("should return canScan false when over limit", () => {
      mockUsePremiumContext.mockReturnValue({
        features: TIER_FEATURES.free,
        isPremium: false,
        dailyScanCount: 5,
        canScanToday: false,
      });

      const result = useCanScanToday();

      expect(result.canScan).toBe(false);
      expect(result.remainingScans).toBe(0); // Max at 0, not negative
    });

    it("should return null remainingScans for premium users", () => {
      mockUsePremiumContext.mockReturnValue({
        features: TIER_FEATURES.premium,
        isPremium: true,
        dailyScanCount: 100,
        canScanToday: true,
      });

      const result = useCanScanToday();

      expect(result.canScan).toBe(true);
      expect(result.remainingScans).toBeNull();
      expect(result.dailyLimit).toBe(UNLIMITED_SCANS);
    });
  });

  describe("usePremiumCamera", () => {
    it("should return correct values for free tier", () => {
      mockUsePremiumContext.mockReturnValue({
        features: TIER_FEATURES.free,
        isPremium: false,
        dailyScanCount: 1,
        canScanToday: true,
        tier: "free" as SubscriptionTier,
      });

      const result = usePremiumCamera();

      expect(result.availableBarcodeTypes).toEqual(ALL_BARCODE_TYPES);
      expect(result.canScan).toBe(true);
      expect(result.remainingScans).toBe(2); // 3 - 1
      expect(result.isPremium).toBe(false);
      expect(result.videoRecording).toBe(false);
    });

    it("should return correct values for premium tier", () => {
      mockUsePremiumContext.mockReturnValue({
        features: TIER_FEATURES.premium,
        isPremium: true,
        dailyScanCount: 50,
        canScanToday: true,
        tier: "premium" as SubscriptionTier,
      });

      const result = usePremiumCamera();

      expect(result.availableBarcodeTypes).toEqual(ALL_BARCODE_TYPES);
      expect(result.canScan).toBe(true);
      expect(result.remainingScans).toBeNull();
      expect(result.isPremium).toBe(true);
      expect(result.videoRecording).toBe(true);
    });

    it("should handle edge case of exactly at limit", () => {
      mockUsePremiumContext.mockReturnValue({
        features: TIER_FEATURES.free,
        isPremium: false,
        dailyScanCount: 3,
        canScanToday: false,
        tier: "free" as SubscriptionTier,
      });

      const result = usePremiumCamera();

      expect(result.canScan).toBe(false);
      expect(result.remainingScans).toBe(0);
    });
  });
});

describe("TIER_FEATURES configuration", () => {
  it("should have correct free tier limits", () => {
    expect(TIER_FEATURES.free.maxDailyScans).toBe(3);
    expect(TIER_FEATURES.free.videoRecording).toBe(false);
  });

  it("should have correct premium tier features", () => {
    expect(TIER_FEATURES.premium.maxDailyScans).toBe(UNLIMITED_SCANS);
    expect(TIER_FEATURES.premium.advancedBarcodes).toBe(true);
    expect(TIER_FEATURES.premium.highQualityCapture).toBe(true);
    expect(TIER_FEATURES.premium.videoRecording).toBe(true);
  });
});
