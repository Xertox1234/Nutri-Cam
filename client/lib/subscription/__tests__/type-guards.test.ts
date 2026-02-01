import { describe, it, expect } from "vitest";
import type { PurchaseState } from "@shared/types/subscription";
import {
  isPurchaseComplete,
  isPurchaseInProgress,
  isPurchaseError,
  isPurchaseCancelled,
  canInitiatePurchase,
} from "../type-guards";

describe("type-guards", () => {
  describe("isPurchaseComplete", () => {
    it("should return true for success state", () => {
      const state: PurchaseState = {
        status: "success",
        productId: "com.nutriscan.premium.annual",
        transactionId: "txn_123",
      };
      expect(isPurchaseComplete(state)).toBe(true);
    });

    it("should return false for non-success states", () => {
      const states: PurchaseState[] = [
        { status: "idle" },
        { status: "loading", productId: "test" },
        { status: "pending", productId: "test", transactionId: "txn" },
        { status: "cancelled", productId: "test" },
        { status: "restoring" },
        {
          status: "error",
          productId: "test",
          error: { code: "UNKNOWN", message: "Error" },
        },
      ];

      states.forEach((state) => {
        expect(isPurchaseComplete(state)).toBe(false);
      });
    });
  });

  describe("isPurchaseInProgress", () => {
    it("should return true for loading state", () => {
      const state: PurchaseState = { status: "loading", productId: "test" };
      expect(isPurchaseInProgress(state)).toBe(true);
    });

    it("should return true for pending state", () => {
      const state: PurchaseState = {
        status: "pending",
        productId: "test",
        transactionId: "txn",
      };
      expect(isPurchaseInProgress(state)).toBe(true);
    });

    it("should return true for restoring state", () => {
      const state: PurchaseState = { status: "restoring" };
      expect(isPurchaseInProgress(state)).toBe(true);
    });

    it("should return false for terminal states", () => {
      const states: PurchaseState[] = [
        { status: "idle" },
        { status: "success", productId: "test", transactionId: "txn" },
        { status: "cancelled", productId: "test" },
        {
          status: "error",
          productId: "test",
          error: { code: "UNKNOWN", message: "Error" },
        },
      ];

      states.forEach((state) => {
        expect(isPurchaseInProgress(state)).toBe(false);
      });
    });
  });

  describe("isPurchaseError", () => {
    it("should return true for error state", () => {
      const state: PurchaseState = {
        status: "error",
        productId: "test",
        error: { code: "NETWORK", message: "Network error" },
      };
      expect(isPurchaseError(state)).toBe(true);
    });

    it("should return false for non-error states", () => {
      const states: PurchaseState[] = [
        { status: "idle" },
        { status: "loading", productId: "test" },
        { status: "success", productId: "test", transactionId: "txn" },
        { status: "cancelled", productId: "test" },
      ];

      states.forEach((state) => {
        expect(isPurchaseError(state)).toBe(false);
      });
    });
  });

  describe("isPurchaseCancelled", () => {
    it("should return true for cancelled state", () => {
      const state: PurchaseState = { status: "cancelled", productId: "test" };
      expect(isPurchaseCancelled(state)).toBe(true);
    });

    it("should return false for non-cancelled states", () => {
      const states: PurchaseState[] = [
        { status: "idle" },
        { status: "loading", productId: "test" },
        { status: "success", productId: "test", transactionId: "txn" },
        {
          status: "error",
          productId: "test",
          error: { code: "UNKNOWN", message: "Error" },
        },
      ];

      states.forEach((state) => {
        expect(isPurchaseCancelled(state)).toBe(false);
      });
    });
  });

  describe("canInitiatePurchase", () => {
    it("should return true for idle state", () => {
      const state: PurchaseState = { status: "idle" };
      expect(canInitiatePurchase(state)).toBe(true);
    });

    it("should return true for cancelled state", () => {
      const state: PurchaseState = { status: "cancelled", productId: "test" };
      expect(canInitiatePurchase(state)).toBe(true);
    });

    it("should return true for error state", () => {
      const state: PurchaseState = {
        status: "error",
        productId: "test",
        error: { code: "NETWORK", message: "Network error" },
      };
      expect(canInitiatePurchase(state)).toBe(true);
    });

    it("should return false for in-progress states", () => {
      const states: PurchaseState[] = [
        { status: "loading", productId: "test" },
        { status: "pending", productId: "test", transactionId: "txn" },
        { status: "restoring" },
      ];

      states.forEach((state) => {
        expect(canInitiatePurchase(state)).toBe(false);
      });
    });

    it("should return false for success state", () => {
      const state: PurchaseState = {
        status: "success",
        productId: "test",
        transactionId: "txn",
      };
      expect(canInitiatePurchase(state)).toBe(false);
    });
  });
});
