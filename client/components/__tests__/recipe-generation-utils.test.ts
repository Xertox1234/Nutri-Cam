import { describe, it, expect } from "vitest";
import {
  DIET_OPTIONS,
  TIME_OPTIONS,
  SERVING_OPTIONS,
  formatIngredientsContext,
} from "../recipe-generation-utils";

describe("DIET_OPTIONS", () => {
  it("has 8 diet options", () => {
    expect(DIET_OPTIONS).toHaveLength(8);
  });

  it("includes common diets", () => {
    expect(DIET_OPTIONS).toContain("Vegetarian");
    expect(DIET_OPTIONS).toContain("Vegan");
    expect(DIET_OPTIONS).toContain("Keto");
  });
});

describe("TIME_OPTIONS", () => {
  it("has 5 time options", () => {
    expect(TIME_OPTIONS).toHaveLength(5);
  });

  it("last option is 'Any' with undefined value", () => {
    const last = TIME_OPTIONS[TIME_OPTIONS.length - 1];
    expect(last.label).toBe("Any");
    expect(last.value).toBeUndefined();
  });

  it("all non-Any options have string values", () => {
    for (const opt of TIME_OPTIONS) {
      if (opt.label !== "Any") {
        expect(typeof opt.value).toBe("string");
      }
    }
  });
});

describe("SERVING_OPTIONS", () => {
  it("has 5 serving options", () => {
    expect(SERVING_OPTIONS).toHaveLength(5);
  });

  it("options are sorted ascending", () => {
    for (let i = 1; i < SERVING_OPTIONS.length; i++) {
      expect(SERVING_OPTIONS[i]).toBeGreaterThan(SERVING_OPTIONS[i - 1]);
    }
  });
});

describe("formatIngredientsContext", () => {
  it("formats single food item", () => {
    const result = formatIngredientsContext([
      { name: "chicken", quantity: "200g" },
    ]);
    expect(result).toBe("chicken (200g)");
  });

  it("formats multiple food items with comma separator", () => {
    const result = formatIngredientsContext([
      { name: "chicken", quantity: "200g" },
      { name: "rice", quantity: "1 cup" },
      { name: "broccoli", quantity: "100g" },
    ]);
    expect(result).toBe("chicken (200g), rice (1 cup), broccoli (100g)");
  });

  it("returns empty string for empty array", () => {
    expect(formatIngredientsContext([])).toBe("");
  });
});
