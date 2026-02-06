import {
  parseIsoDuration,
  normalizeInstructions,
  parseIngredientString,
  findRecipeInLdJson,
} from "../recipe-import";

describe("Recipe Import", () => {
  describe("parseIsoDuration", () => {
    it("parses minutes only", () => {
      expect(parseIsoDuration("PT15M")).toBe(15);
    });

    it("parses hours and minutes", () => {
      expect(parseIsoDuration("PT1H30M")).toBe(90);
    });

    it("parses hours only", () => {
      expect(parseIsoDuration("PT2H")).toBe(120);
    });

    it("returns null for undefined", () => {
      expect(parseIsoDuration(undefined)).toBeNull();
    });

    it("returns null for invalid format", () => {
      expect(parseIsoDuration("invalid")).toBeNull();
      expect(parseIsoDuration("")).toBeNull();
    });

    it("handles zero minutes", () => {
      expect(parseIsoDuration("PT0M")).toBe(0);
    });
  });

  describe("normalizeInstructions", () => {
    it("returns null for undefined", () => {
      expect(normalizeInstructions(undefined)).toBeNull();
    });

    it("returns trimmed string for string input", () => {
      expect(normalizeInstructions("Step 1. Cook.")).toBe("Step 1. Cook.");
    });

    it("strips HTML from string input", () => {
      expect(normalizeInstructions("<p>Cook the <b>pasta</b></p>")).toBe(
        "Cook the pasta",
      );
    });

    it("formats HowToStep array with numbered steps", () => {
      const steps = [
        { "@type": "HowToStep" as const, text: "Preheat oven" },
        { "@type": "HowToStep" as const, text: "Mix ingredients" },
      ];
      const result = normalizeInstructions(steps);
      expect(result).toBe("1. Preheat oven\n2. Mix ingredients");
    });

    it("handles array of plain strings", () => {
      const steps = ["Preheat oven", "Mix ingredients"];
      const result = normalizeInstructions(steps);
      expect(result).toBe("1. Preheat oven\n2. Mix ingredients");
    });

    it("strips HTML from HowToStep text", () => {
      const steps = [
        { "@type": "HowToStep" as const, text: "<p>Cook <b>pasta</b></p>" },
      ];
      expect(normalizeInstructions(steps)).toBe("1. Cook pasta");
    });
  });

  describe("parseIngredientString", () => {
    it("parses quantity, unit, and name", () => {
      const result = parseIngredientString("2 cups flour");
      expect(result).toEqual({
        name: "flour",
        quantity: "2",
        unit: "cups",
      });
    });

    it("parses fraction quantities", () => {
      const result = parseIngredientString("1/2 tsp salt");
      expect(result).toEqual({
        name: "salt",
        quantity: "1/2",
        unit: "tsp",
      });
    });

    it("handles ingredient with no unit", () => {
      const result = parseIngredientString("3 large eggs");
      expect(result).toEqual({
        name: "eggs",
        quantity: "3",
        unit: "large",
      });
    });

    it("handles ingredient with no quantity or unit", () => {
      const result = parseIngredientString("salt and pepper to taste");
      expect(result.name).toBeTruthy();
    });

    it("handles 'of' connector", () => {
      const result = parseIngredientString("1 cup of sugar");
      expect(result).toEqual({
        name: "sugar",
        quantity: "1",
        unit: "cup",
      });
    });

    it("trims whitespace", () => {
      const result = parseIngredientString("  2 tbsp olive oil  ");
      expect(result).toEqual({
        name: "olive oil",
        quantity: "2",
        unit: "tbsp",
      });
    });
  });

  describe("findRecipeInLdJson", () => {
    it("finds top-level Recipe", () => {
      const data = { "@type": "Recipe", name: "Test Recipe" };
      expect(findRecipeInLdJson(data)).toEqual(data);
    });

    it("finds Recipe in @graph", () => {
      const recipe = { "@type": "Recipe", name: "Test Recipe" };
      const data = {
        "@context": "https://schema.org",
        "@graph": [{ "@type": "WebPage", name: "Page" }, recipe],
      };
      expect(findRecipeInLdJson(data)).toEqual(recipe);
    });

    it("finds Recipe in top-level array", () => {
      const recipe = { "@type": "Recipe", name: "Test Recipe" };
      expect(findRecipeInLdJson([recipe])).toEqual(recipe);
    });

    it("handles @type as array", () => {
      const data = { "@type": ["Recipe", "CreativeWork"], name: "Test" };
      expect(findRecipeInLdJson(data)).toEqual(data);
    });

    it("returns null for non-Recipe data", () => {
      expect(
        findRecipeInLdJson({ "@type": "Article", name: "Test" }),
      ).toBeNull();
    });

    it("returns null for null/undefined", () => {
      expect(findRecipeInLdJson(null)).toBeNull();
      expect(findRecipeInLdJson(undefined)).toBeNull();
    });

    it("returns null for empty object", () => {
      expect(findRecipeInLdJson({})).toBeNull();
    });
  });
});
