import { describe, it, expect } from "vitest";
import { BENEFITS, getCtaLabel, isCtaDisabled } from "../upgrade-modal-utils";

describe("BENEFITS constant", () => {
  it("has exactly 4 benefits", () => {
    expect(BENEFITS).toHaveLength(4);
  });

  it("each benefit has icon and label", () => {
    for (const benefit of BENEFITS) {
      expect(typeof benefit.icon).toBe("string");
      expect(typeof benefit.label).toBe("string");
      expect(benefit.label.length).toBeGreaterThan(0);
    }
  });

  it("includes unlimited scans benefit", () => {
    expect(BENEFITS.some((b) => b.label.includes("Unlimited"))).toBe(true);
  });

  it("includes recipe generation benefit", () => {
    expect(BENEFITS.some((b) => b.label.includes("recipe"))).toBe(true);
  });
});

describe("getCtaLabel", () => {
  it("returns processing label for loading state", () => {
    expect(getCtaLabel("loading")).toBe("Processing...");
  });

  it("returns processing label for pending state", () => {
    expect(getCtaLabel("pending")).toBe("Processing...");
  });

  it("returns restoring label for restoring state", () => {
    expect(getCtaLabel("restoring")).toBe("Restoring...");
  });

  it("returns welcome label for success state", () => {
    expect(getCtaLabel("success")).toBe("Welcome to Premium!");
  });

  it("returns default trial label for idle state", () => {
    expect(getCtaLabel("idle")).toBe("Start 3-Day Free Trial");
  });

  it("returns default trial label for error state", () => {
    expect(getCtaLabel("error")).toBe("Start 3-Day Free Trial");
  });

  it("returns default trial label for cancelled state", () => {
    expect(getCtaLabel("cancelled")).toBe("Start 3-Day Free Trial");
  });
});

describe("isCtaDisabled", () => {
  it("is disabled during loading", () => {
    expect(isCtaDisabled("loading")).toBe(true);
  });

  it("is disabled during pending", () => {
    expect(isCtaDisabled("pending")).toBe(true);
  });

  it("is disabled during restoring", () => {
    expect(isCtaDisabled("restoring")).toBe(true);
  });

  it("is disabled on success", () => {
    expect(isCtaDisabled("success")).toBe(true);
  });

  it("is enabled on idle", () => {
    expect(isCtaDisabled("idle")).toBe(false);
  });

  it("is enabled on error", () => {
    expect(isCtaDisabled("error")).toBe(false);
  });

  it("is enabled on cancelled", () => {
    expect(isCtaDisabled("cancelled")).toBe(false);
  });
});
