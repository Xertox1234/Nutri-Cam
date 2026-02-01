import { describe, it, expect } from "vitest";
import type { PurchaseState, PurchaseError } from "../types/subscription";

describe("Subscription Types", () => {
  describe("PurchaseState discriminated union", () => {
    it("should support idle state", () => {
      const state: PurchaseState = { status: "idle" };
      expect(state.status).toBe("idle");
    });

    it("should support loading state with productId", () => {
      const state: PurchaseState = {
        status: "loading",
        productId: "com.nutriscan.premium.annual",
      };
      expect(state.status).toBe("loading");
      expect(state.productId).toBe("com.nutriscan.premium.annual");
    });

    it("should support pending state with productId and transactionId", () => {
      const state: PurchaseState = {
        status: "pending",
        productId: "com.nutriscan.premium.annual",
        transactionId: "txn_123",
      };
      expect(state.status).toBe("pending");
      expect(state.productId).toBe("com.nutriscan.premium.annual");
      expect(state.transactionId).toBe("txn_123");
    });

    it("should support success state with productId and transactionId", () => {
      const state: PurchaseState = {
        status: "success",
        productId: "com.nutriscan.premium.annual",
        transactionId: "txn_123",
      };
      expect(state.status).toBe("success");
    });

    it("should support cancelled state with productId", () => {
      const state: PurchaseState = {
        status: "cancelled",
        productId: "com.nutriscan.premium.annual",
      };
      expect(state.status).toBe("cancelled");
    });

    it("should support restoring state", () => {
      const state: PurchaseState = { status: "restoring" };
      expect(state.status).toBe("restoring");
    });

    it("should support error state with PurchaseError", () => {
      const error: PurchaseError = {
        code: "NETWORK",
        message: "Network connection failed",
      };
      const state: PurchaseState = {
        status: "error",
        error,
        productId: "com.nutriscan.premium.annual",
      };
      expect(state.status).toBe("error");
      expect(state.error.code).toBe("NETWORK");
      expect(state.error.message).toBe("Network connection failed");
    });

    it("should allow exhaustive status checking", () => {
      const state: PurchaseState = { status: "idle" };

      // This function would fail TypeScript compilation if we miss a status
      function getStatusMessage(s: PurchaseState): string {
        switch (s.status) {
          case "idle":
            return "Ready to purchase";
          case "loading":
            return `Loading ${s.productId}`;
          case "pending":
            return `Pending ${s.transactionId}`;
          case "success":
            return "Purchase complete";
          case "cancelled":
            return "Purchase cancelled";
          case "restoring":
            return "Restoring purchases";
          case "error":
            return s.error.message;
        }
      }

      expect(getStatusMessage(state)).toBe("Ready to purchase");
    });
  });

  describe("PurchaseError", () => {
    it("should support error with originalError", () => {
      const originalError = new Error("Connection timeout");
      const error: PurchaseError = {
        code: "NETWORK",
        message: "Failed to connect to App Store",
        originalError,
      };
      expect(error.originalError).toBe(originalError);
    });

    it("should support all error codes", () => {
      const codes: PurchaseError["code"][] = [
        "NETWORK",
        "STORE_UNAVAILABLE",
        "ALREADY_OWNED",
        "USER_CANCELLED",
        "UNKNOWN",
      ];

      codes.forEach((code) => {
        const error: PurchaseError = { code, message: `Error: ${code}` };
        expect(error.code).toBe(code);
      });
    });
  });
});
