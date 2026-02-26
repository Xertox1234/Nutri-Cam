import { describe, it, expect } from "vitest";
import {
  APPETITE_LEVELS,
  getAppetiteLabel,
  getAppetiteEmoji,
} from "../appetite-utils";

describe("APPETITE_LEVELS", () => {
  it("has 5 levels", () => {
    expect(APPETITE_LEVELS).toHaveLength(5);
  });

  it("has values 1 through 5", () => {
    expect(APPETITE_LEVELS.map((l) => l.value)).toEqual([1, 2, 3, 4, 5]);
  });

  it("each level has label and emoji", () => {
    for (const level of APPETITE_LEVELS) {
      expect(level.label).toBeTruthy();
      expect(level.emoji).toBeTruthy();
    }
  });
});

describe("getAppetiteLabel", () => {
  it("returns correct labels for valid levels", () => {
    expect(getAppetiteLabel(1)).toBe("Very Low");
    expect(getAppetiteLabel(2)).toBe("Low");
    expect(getAppetiteLabel(3)).toBe("Normal");
    expect(getAppetiteLabel(4)).toBe("High");
    expect(getAppetiteLabel(5)).toBe("Very High");
  });

  it("returns empty string for null", () => {
    expect(getAppetiteLabel(null)).toBe("");
  });

  it("returns empty string for out-of-range values", () => {
    expect(getAppetiteLabel(0)).toBe("");
    expect(getAppetiteLabel(6)).toBe("");
    expect(getAppetiteLabel(-1)).toBe("");
  });

  it("returns empty string for fractional values", () => {
    expect(getAppetiteLabel(1.5)).toBe("");
    expect(getAppetiteLabel(3.7)).toBe("");
  });
});

describe("getAppetiteEmoji", () => {
  it("returns emojis for valid levels", () => {
    for (let i = 1; i <= 5; i++) {
      expect(getAppetiteEmoji(i)).toBeTruthy();
    }
  });

  it("returns empty string for null", () => {
    expect(getAppetiteEmoji(null)).toBe("");
  });

  it("returns empty string for out-of-range values", () => {
    expect(getAppetiteEmoji(0)).toBe("");
    expect(getAppetiteEmoji(6)).toBe("");
  });

  it("returns empty string for fractional values", () => {
    expect(getAppetiteEmoji(2.5)).toBe("");
  });
});
