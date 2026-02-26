import { describe, it, expect } from "vitest";
import {
  FASTING_PROTOCOLS,
  resolveFastingSchedule,
  isValidFastingHours,
} from "../fasting-setup-utils";

describe("FASTING_PROTOCOLS", () => {
  it("has 4 protocols", () => {
    expect(FASTING_PROTOCOLS).toHaveLength(4);
  });

  it("includes standard protocols and custom", () => {
    const keys = FASTING_PROTOCOLS.map((p) => p.key);
    expect(keys).toContain("16:8");
    expect(keys).toContain("18:6");
    expect(keys).toContain("20:4");
    expect(keys).toContain("custom");
  });

  it("protocol hours add up to 24", () => {
    for (const p of FASTING_PROTOCOLS) {
      if (p.key !== "custom") {
        expect(p.fastingHours + p.eatingHours).toBe(24);
      }
    }
  });
});

describe("resolveFastingSchedule", () => {
  it("returns preset hours for 16:8", () => {
    expect(resolveFastingSchedule("16:8", "")).toEqual({
      fastingHours: 16,
      eatingHours: 8,
    });
  });

  it("returns preset hours for 18:6", () => {
    expect(resolveFastingSchedule("18:6", "")).toEqual({
      fastingHours: 18,
      eatingHours: 6,
    });
  });

  it("returns preset hours for 20:4", () => {
    expect(resolveFastingSchedule("20:4", "")).toEqual({
      fastingHours: 20,
      eatingHours: 4,
    });
  });

  it("uses custom hours input for custom protocol", () => {
    expect(resolveFastingSchedule("custom", "14")).toEqual({
      fastingHours: 14,
      eatingHours: 10,
    });
  });

  it("defaults to 16 for invalid custom input", () => {
    expect(resolveFastingSchedule("custom", "")).toEqual({
      fastingHours: 16,
      eatingHours: 8,
    });
    expect(resolveFastingSchedule("custom", "abc")).toEqual({
      fastingHours: 16,
      eatingHours: 8,
    });
  });

  it("defaults to 16:8 for unknown protocol", () => {
    expect(resolveFastingSchedule("unknown", "")).toEqual({
      fastingHours: 16,
      eatingHours: 8,
    });
  });
});

describe("isValidFastingHours", () => {
  it("returns true for valid range (1-23)", () => {
    expect(isValidFastingHours(1)).toBe(true);
    expect(isValidFastingHours(16)).toBe(true);
    expect(isValidFastingHours(23)).toBe(true);
  });

  it("returns false for 0", () => {
    expect(isValidFastingHours(0)).toBe(false);
  });

  it("returns false for 24 or more", () => {
    expect(isValidFastingHours(24)).toBe(false);
    expect(isValidFastingHours(25)).toBe(false);
  });

  it("returns false for negative values", () => {
    expect(isValidFastingHours(-1)).toBe(false);
  });
});
