import { describe, it, expect, vi } from "vitest";

import { getIngredientIcon, getCategoryIcon } from "../ingredient-icon";

// vi.mock is hoisted — factory must use inline values, not top-level variables
vi.mock("@/data/ingredient-icon-map", () => ({
  ingredientIconMap: {
    tomato: 1,
    chicken: 2,
    "sweet-potato": 3,
    salmon: 4,
    "bell-pepper": 5,
    "olive-oil": 6,
    spinach: 7,
    "ice-cream": 8,
    egg: 9,
  } as Record<string, number>,
  categoryIconMap: {
    "category-produce": 100,
    "category-meat": 101,
    "category-other": 102,
  } as Record<string, number>,
  ingredientNameToSlug: {
    tomato: "tomato",
    chicken: "chicken",
    "sweet potato": "sweet-potato",
    salmon: "salmon",
    "bell pepper": "bell-pepper",
    "olive oil": "olive-oil",
    spinach: "spinach",
    "ice cream": "ice-cream",
    egg: "egg",
  } as Record<string, string>,
}));

describe("ingredient-icon", () => {
  describe("getIngredientIcon", () => {
    it("returns null for empty string", () => {
      expect(getIngredientIcon("")).toBeNull();
    });

    it("matches exact slug", () => {
      expect(getIngredientIcon("tomato")).toBe(1);
    });

    it("is case-insensitive", () => {
      expect(getIngredientIcon("Tomato")).toBe(1);
      expect(getIngredientIcon("CHICKEN")).toBe(2);
    });

    it("matches multi-word ingredient names", () => {
      expect(getIngredientIcon("sweet potato")).toBe(3);
      expect(getIngredientIcon("bell pepper")).toBe(5);
      expect(getIngredientIcon("olive oil")).toBe(6);
    });

    it("strips common prefixes", () => {
      expect(getIngredientIcon("fresh tomato")).toBe(1);
      expect(getIngredientIcon("organic spinach")).toBe(7);
      expect(getIngredientIcon("dried tomato")).toBe(1);
      expect(getIngredientIcon("chopped chicken")).toBe(2);
      expect(getIngredientIcon("frozen spinach")).toBe(7);
    });

    it("depluralize — trailing 's'", () => {
      expect(getIngredientIcon("tomatoes")).toBe(1);
      expect(getIngredientIcon("eggs")).toBe(9);
    });

    it("substring match — finds ingredient inside longer name", () => {
      expect(getIngredientIcon("boneless chicken thigh")).toBe(2);
      expect(getIngredientIcon("baby spinach leaves")).toBe(7);
    });

    it("prefers longer substring matches", () => {
      // "sweet potato" should match before "potato" (if both existed)
      expect(getIngredientIcon("roasted sweet potato wedges")).toBe(3);
    });

    it("returns null for unknown ingredients", () => {
      expect(getIngredientIcon("dragon fruit")).toBeNull();
      expect(getIngredientIcon("xyz unknown")).toBeNull();
    });

    it("handles trimming and whitespace", () => {
      expect(getIngredientIcon("  tomato  ")).toBe(1);
    });
  });

  describe("getCategoryIcon", () => {
    it("returns category icon for known category", () => {
      expect(getCategoryIcon("produce")).toBe(100);
      expect(getCategoryIcon("meat")).toBe(101);
    });

    it("is case-insensitive", () => {
      expect(getCategoryIcon("Produce")).toBe(100);
      expect(getCategoryIcon("MEAT")).toBe(101);
    });

    it("falls back to category-other for unknown category", () => {
      expect(getCategoryIcon("unknown")).toBe(102);
    });

    it("falls back to category-other for undefined", () => {
      expect(getCategoryIcon(undefined)).toBe(102);
    });
  });
});
