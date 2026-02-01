import { describe, it, expect } from "vitest";
import {
  PlatformSchema,
  UpgradeRequestSchema,
  UpgradeResponseSchema,
  RestoreRequestSchema,
  RestoreResponseSchema,
} from "../subscription";

describe("Subscription Schemas", () => {
  describe("PlatformSchema", () => {
    it("should accept ios", () => {
      expect(PlatformSchema.parse("ios")).toBe("ios");
    });

    it("should accept android", () => {
      expect(PlatformSchema.parse("android")).toBe("android");
    });

    it("should reject invalid platforms", () => {
      expect(() => PlatformSchema.parse("windows")).toThrow();
      expect(() => PlatformSchema.parse("")).toThrow();
    });
  });

  describe("UpgradeRequestSchema", () => {
    const validRequest = {
      receipt: "valid_receipt_data",
      platform: "ios" as const,
      productId: "com.nutriscan.premium.annual",
      transactionId: "txn_123",
    };

    it("should accept valid upgrade request", () => {
      const result = UpgradeRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRequest);
      }
    });

    it("should reject empty receipt", () => {
      const result = UpgradeRequestSchema.safeParse({
        ...validRequest,
        receipt: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty productId", () => {
      const result = UpgradeRequestSchema.safeParse({
        ...validRequest,
        productId: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty transactionId", () => {
      const result = UpgradeRequestSchema.safeParse({
        ...validRequest,
        transactionId: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid platform", () => {
      const result = UpgradeRequestSchema.safeParse({
        ...validRequest,
        platform: "web",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing fields", () => {
      const result = UpgradeRequestSchema.safeParse({
        receipt: "test",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpgradeResponseSchema", () => {
    it("should accept successful response", () => {
      const response = {
        success: true as const,
        tier: "premium" as const,
        expiresAt: "2027-02-01T00:00:00.000Z",
      };
      const result = UpgradeResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should accept error response with code", () => {
      const response = {
        success: false as const,
        error: "Invalid receipt",
        code: "INVALID_RECEIPT" as const,
      };
      const result = UpgradeResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should accept error response without code", () => {
      const response = {
        success: false as const,
        error: "Something went wrong",
      };
      const result = UpgradeResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should reject invalid tier", () => {
      const response = {
        success: true as const,
        tier: "super-premium",
        expiresAt: "2027-02-01T00:00:00.000Z",
      };
      const result = UpgradeResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it("should reject invalid datetime format", () => {
      const response = {
        success: true as const,
        tier: "premium" as const,
        expiresAt: "not-a-date",
      };
      const result = UpgradeResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it("should reject invalid error code", () => {
      const response = {
        success: false as const,
        error: "Bad request",
        code: "NOT_A_REAL_CODE",
      };
      const result = UpgradeResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });

  describe("RestoreRequestSchema", () => {
    it("should accept valid restore request", () => {
      const request = {
        platform: "android" as const,
        receipts: [
          {
            receipt: "receipt_1",
            transactionId: "txn_1",
            productId: "com.nutriscan.premium.annual",
          },
        ],
      };
      const result = RestoreRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should accept empty receipts array", () => {
      const request = {
        platform: "ios" as const,
        receipts: [],
      };
      const result = RestoreRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should reject receipts with empty transactionId", () => {
      const request = {
        platform: "ios" as const,
        receipts: [
          {
            receipt: "receipt_1",
            transactionId: "",
            productId: "com.nutriscan.premium",
          },
        ],
      };
      const result = RestoreRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe("RestoreResponseSchema", () => {
    it("should accept successful restore response", () => {
      const response = {
        success: true as const,
        tier: "premium" as const,
        expiresAt: "2027-02-01T00:00:00.000Z",
        restoredCount: 1,
      };
      const result = RestoreResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should accept null expiresAt for free tier restore", () => {
      const response = {
        success: true as const,
        tier: "free" as const,
        expiresAt: null,
        restoredCount: 0,
      };
      const result = RestoreResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should accept error response", () => {
      const response = {
        success: false as const,
        error: "No purchases found",
        code: "NO_PURCHASES_FOUND" as const,
      };
      const result = RestoreResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });
});
