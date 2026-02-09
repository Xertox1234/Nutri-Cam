import type { PurchaseError, PurchaseState } from "../types/subscription";

describe("PurchaseError", () => {
  it("should allow NETWORK code", () => {
    const error: PurchaseError = { code: "NETWORK", message: "No connection" };
    expect(error.code).toBe("NETWORK");
    expect(error.message).toBe("No connection");
  });

  it("should allow STORE_UNAVAILABLE code", () => {
    const error: PurchaseError = {
      code: "STORE_UNAVAILABLE",
      message: "Store down",
    };
    expect(error.code).toBe("STORE_UNAVAILABLE");
  });

  it("should allow ALREADY_OWNED code", () => {
    const error: PurchaseError = {
      code: "ALREADY_OWNED",
      message: "Already subscribed",
    };
    expect(error.code).toBe("ALREADY_OWNED");
  });

  it("should allow USER_CANCELLED code", () => {
    const error: PurchaseError = {
      code: "USER_CANCELLED",
      message: "Cancelled",
    };
    expect(error.code).toBe("USER_CANCELLED");
  });

  it("should allow UNKNOWN code", () => {
    const error: PurchaseError = { code: "UNKNOWN", message: "Unknown error" };
    expect(error.code).toBe("UNKNOWN");
  });

  it("should allow optional originalError", () => {
    const original = new Error("native error");
    const error: PurchaseError = {
      code: "NETWORK",
      message: "Failed",
      originalError: original,
    };
    expect(error.originalError).toBe(original);
  });
});

describe("PurchaseState", () => {
  it("should represent idle state", () => {
    const state: PurchaseState = { status: "idle" };
    expect(state.status).toBe("idle");
  });

  it("should represent loading state", () => {
    const state: PurchaseState = { status: "loading" };
    expect(state.status).toBe("loading");
  });

  it("should represent pending state", () => {
    const state: PurchaseState = { status: "pending" };
    expect(state.status).toBe("pending");
  });

  it("should represent success state", () => {
    const state: PurchaseState = { status: "success" };
    expect(state.status).toBe("success");
  });

  it("should represent cancelled state", () => {
    const state: PurchaseState = { status: "cancelled" };
    expect(state.status).toBe("cancelled");
  });

  it("should represent restoring state", () => {
    const state: PurchaseState = { status: "restoring" };
    expect(state.status).toBe("restoring");
  });

  it("should represent error state with PurchaseError", () => {
    const state: PurchaseState = {
      status: "error",
      error: { code: "NETWORK", message: "Connection failed" },
    };
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.error.code).toBe("NETWORK");
      expect(state.error.message).toBe("Connection failed");
    }
  });

  it("should narrow error state correctly via discriminant", () => {
    const state: PurchaseState = {
      status: "error",
      error: { code: "UNKNOWN", message: "Something went wrong" },
    };
    if (state.status === "error") {
      // TypeScript narrows this to the error variant
      expect(state.error).toBeDefined();
    }
  });
});
