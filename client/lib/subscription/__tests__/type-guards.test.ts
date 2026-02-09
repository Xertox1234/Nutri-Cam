import type { PurchaseState } from "@shared/types/subscription";
import {
  isPurchaseComplete,
  isPurchaseInProgress,
  canInitiatePurchase,
} from "../type-guards";

describe("isPurchaseComplete", () => {
  it("should return true for success state", () => {
    const state: PurchaseState = { status: "success" };
    expect(isPurchaseComplete(state)).toBe(true);
  });

  it("should return false for idle state", () => {
    const state: PurchaseState = { status: "idle" };
    expect(isPurchaseComplete(state)).toBe(false);
  });

  it("should return false for loading state", () => {
    const state: PurchaseState = { status: "loading" };
    expect(isPurchaseComplete(state)).toBe(false);
  });

  it("should return false for error state", () => {
    const state: PurchaseState = {
      status: "error",
      error: { code: "UNKNOWN", message: "err" },
    };
    expect(isPurchaseComplete(state)).toBe(false);
  });

  it("should return false for cancelled state", () => {
    const state: PurchaseState = { status: "cancelled" };
    expect(isPurchaseComplete(state)).toBe(false);
  });
});

describe("isPurchaseInProgress", () => {
  it("should return true for loading state", () => {
    const state: PurchaseState = { status: "loading" };
    expect(isPurchaseInProgress(state)).toBe(true);
  });

  it("should return true for pending state", () => {
    const state: PurchaseState = { status: "pending" };
    expect(isPurchaseInProgress(state)).toBe(true);
  });

  it("should return true for restoring state", () => {
    const state: PurchaseState = { status: "restoring" };
    expect(isPurchaseInProgress(state)).toBe(true);
  });

  it("should return false for idle state", () => {
    const state: PurchaseState = { status: "idle" };
    expect(isPurchaseInProgress(state)).toBe(false);
  });

  it("should return false for success state", () => {
    const state: PurchaseState = { status: "success" };
    expect(isPurchaseInProgress(state)).toBe(false);
  });

  it("should return false for cancelled state", () => {
    const state: PurchaseState = { status: "cancelled" };
    expect(isPurchaseInProgress(state)).toBe(false);
  });

  it("should return false for error state", () => {
    const state: PurchaseState = {
      status: "error",
      error: { code: "NETWORK", message: "err" },
    };
    expect(isPurchaseInProgress(state)).toBe(false);
  });
});

describe("canInitiatePurchase", () => {
  it("should return true for idle state", () => {
    const state: PurchaseState = { status: "idle" };
    expect(canInitiatePurchase(state)).toBe(true);
  });

  it("should return true for cancelled state", () => {
    const state: PurchaseState = { status: "cancelled" };
    expect(canInitiatePurchase(state)).toBe(true);
  });

  it("should return true for error state", () => {
    const state: PurchaseState = {
      status: "error",
      error: { code: "UNKNOWN", message: "err" },
    };
    expect(canInitiatePurchase(state)).toBe(true);
  });

  it("should return false for loading state", () => {
    const state: PurchaseState = { status: "loading" };
    expect(canInitiatePurchase(state)).toBe(false);
  });

  it("should return false for pending state", () => {
    const state: PurchaseState = { status: "pending" };
    expect(canInitiatePurchase(state)).toBe(false);
  });

  it("should return false for restoring state", () => {
    const state: PurchaseState = { status: "restoring" };
    expect(canInitiatePurchase(state)).toBe(false);
  });

  it("should return false for success state", () => {
    const state: PurchaseState = { status: "success" };
    expect(canInitiatePurchase(state)).toBe(false);
  });
});
