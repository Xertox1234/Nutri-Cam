import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  UpgradeRequestSchema,
  RestoreRequestSchema,
  UpgradeResponseSchema,
  RestoreResponseSchema,
} from "@shared/schemas/subscription";

// Mock the receipt validation service
vi.mock("../services/receipt-validation", () => ({
  validateReceipt: vi.fn().mockResolvedValue({
    valid: true,
    productId: "com.nutriscan.premium.annual",
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    originalTransactionId: "mock_txn_123",
  }),
}));

describe("Subscription API", () => {
  describe("UpgradeRequestSchema validation", () => {
    it("should accept valid upgrade request", () => {
      const validRequest = {
        receipt: "valid_receipt_data",
        platform: "ios" as const,
        productId: "com.nutriscan.premium.annual",
        transactionId: "txn_123",
      };

      const result = UpgradeRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should reject request with empty receipt", () => {
      const invalidRequest = {
        receipt: "",
        platform: "ios" as const,
        productId: "com.nutriscan.premium.annual",
        transactionId: "txn_123",
      };

      const result = UpgradeRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should reject request with invalid platform", () => {
      const invalidRequest = {
        receipt: "valid_receipt",
        platform: "web",
        productId: "com.nutriscan.premium.annual",
        transactionId: "txn_123",
      };

      const result = UpgradeRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should reject request with empty transactionId", () => {
      const invalidRequest = {
        receipt: "valid_receipt",
        platform: "ios" as const,
        productId: "com.nutriscan.premium.annual",
        transactionId: "",
      };

      const result = UpgradeRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe("RestoreRequestSchema validation", () => {
    it("should accept valid restore request with receipts", () => {
      const validRequest = {
        platform: "android" as const,
        receipts: [
          {
            receipt: "receipt_1",
            transactionId: "txn_1",
            productId: "com.nutriscan.premium.annual",
          },
          {
            receipt: "receipt_2",
            transactionId: "txn_2",
            productId: "com.nutriscan.premium.annual",
          },
        ],
      };

      const result = RestoreRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should accept restore request with empty receipts", () => {
      const validRequest = {
        platform: "ios" as const,
        receipts: [],
      };

      const result = RestoreRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should reject restore with invalid platform", () => {
      const invalidRequest = {
        platform: "windows",
        receipts: [],
      };

      const result = RestoreRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe("UpgradeResponseSchema validation", () => {
    it("should validate successful upgrade response", () => {
      const response = {
        success: true as const,
        tier: "premium" as const,
        expiresAt: "2027-02-01T00:00:00.000Z",
      };

      const result = UpgradeResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should validate error upgrade response", () => {
      const response = {
        success: false as const,
        error: "Invalid receipt",
        code: "INVALID_RECEIPT" as const,
      };

      const result = UpgradeResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("RestoreResponseSchema validation", () => {
    it("should validate successful restore response", () => {
      const response = {
        success: true as const,
        tier: "premium" as const,
        expiresAt: "2027-02-01T00:00:00.000Z",
        restoredCount: 2,
      };

      const result = RestoreResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should validate restore response with null expiresAt", () => {
      const response = {
        success: true as const,
        tier: "free" as const,
        expiresAt: null,
        restoredCount: 0,
      };

      const result = RestoreResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should validate error restore response", () => {
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

describe("Receipt Validation Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return valid for iOS receipts (stub)", async () => {
    const { validateReceipt } = await import("../services/receipt-validation");
    const result = await validateReceipt("test_receipt", "ios");

    expect(result.valid).toBe(true);
    expect(result.productId).toBeDefined();
    expect(result.expiresAt).toBeDefined();
  });

  it("should return valid for Android receipts (stub)", async () => {
    const { validateReceipt } = await import("../services/receipt-validation");
    const result = await validateReceipt("test_receipt", "android");

    expect(result.valid).toBe(true);
    expect(result.productId).toBeDefined();
    expect(result.expiresAt).toBeDefined();
  });
});

describe("API Error Helper", () => {
  it("should create proper error response structure", async () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const { sendError } = await import("../lib/api-errors");
    sendError(mockRes as any, 400, "Bad request", {
      code: "VALIDATION_ERROR",
      details: { field: "missing" },
    });

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Bad request",
      code: "VALIDATION_ERROR",
      details: { field: "missing" },
    });
  });

  it("should create error response without optional fields", async () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const { sendError } = await import("../lib/api-errors");
    sendError(mockRes as any, 500, "Server error");

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Server error",
    });
  });
});
