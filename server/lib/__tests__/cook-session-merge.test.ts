import {
  mergeDetectedIngredients,
  MAX_INGREDIENTS_PER_SESSION,
} from "../cook-session-merge";
import type { CookingSessionIngredient } from "@shared/types/cook-session";

/** Helper to create a test ingredient with defaults. */
function makeIngredient(
  overrides: Partial<CookingSessionIngredient> & { name: string },
): CookingSessionIngredient {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name,
    quantity: overrides.quantity ?? 1,
    unit: overrides.unit ?? "piece",
    confidence: overrides.confidence ?? 0.9,
    category: overrides.category ?? "other",
    photoId: overrides.photoId ?? "photo-1",
    userEdited: overrides.userEdited ?? false,
    preparationMethod: overrides.preparationMethod,
  };
}

describe("mergeDetectedIngredients", () => {
  describe("userEdited flag — AI merges do not overwrite manually edited ingredients", () => {
    it("accumulates quantity for non-edited duplicate ingredients", () => {
      const existing = [makeIngredient({ name: "Tomato", quantity: 2 })];
      const incoming = [makeIngredient({ name: "Tomato", quantity: 3 })];

      const result = mergeDetectedIngredients(existing, incoming);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Tomato");
      expect(result[0].quantity).toBe(5); // 2 + 3
    });

    it("does NOT merge into a user-edited ingredient with the same name", () => {
      const existing = [
        makeIngredient({
          name: "Tomato",
          quantity: 2,
          unit: "cup",
          userEdited: true,
        }),
      ];
      const incoming = [
        makeIngredient({ name: "Tomato", quantity: 3, unit: "piece" }),
      ];

      const result = mergeDetectedIngredients(existing, incoming);

      // Should have 2 entries: the user-edited one untouched + the new detection
      expect(result).toHaveLength(2);

      const edited = result.find((i) => i.userEdited);
      expect(edited).toBeDefined();
      expect(edited!.quantity).toBe(2); // Unchanged
      expect(edited!.unit).toBe("cup"); // Unchanged

      const detected = result.find((i) => !i.userEdited);
      expect(detected).toBeDefined();
      expect(detected!.quantity).toBe(3);
    });

    it("preserves user edits even with case-different AI detection", () => {
      const existing = [
        makeIngredient({
          name: "brown rice",
          quantity: 1,
          unit: "cup",
          userEdited: true,
        }),
      ];
      const incoming = [
        makeIngredient({ name: "Brown Rice", quantity: 2, unit: "cup" }),
      ];

      const result = mergeDetectedIngredients(existing, incoming);

      expect(result).toHaveLength(2);
      const edited = result.find((i) => i.userEdited);
      expect(edited!.quantity).toBe(1); // Not modified
    });

    it("merges case-insensitively for non-edited ingredients", () => {
      const existing = [
        makeIngredient({ name: "chicken breast", quantity: 1 }),
      ];
      const incoming = [
        makeIngredient({ name: "Chicken Breast", quantity: 1 }),
      ];

      const result = mergeDetectedIngredients(existing, incoming);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(2);
    });

    it("takes max confidence on merge", () => {
      const existing = [makeIngredient({ name: "Onion", confidence: 0.7 })];
      const incoming = [makeIngredient({ name: "Onion", confidence: 0.95 })];

      const result = mergeDetectedIngredients(existing, incoming);

      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBe(0.95);
    });

    it("keeps existing confidence when it is higher", () => {
      const existing = [makeIngredient({ name: "Garlic", confidence: 0.99 })];
      const incoming = [makeIngredient({ name: "Garlic", confidence: 0.6 })];

      const result = mergeDetectedIngredients(existing, incoming);

      expect(result[0].confidence).toBe(0.99);
    });
  });

  describe("capacity limit", () => {
    it("does not add beyond maxIngredients", () => {
      const existing = [
        makeIngredient({ name: "A" }),
        makeIngredient({ name: "B" }),
      ];
      const incoming = [
        makeIngredient({ name: "C" }),
        makeIngredient({ name: "D" }),
      ];

      const result = mergeDetectedIngredients(existing, incoming, 3);

      expect(result).toHaveLength(3);
      expect(result.map((i) => i.name)).toEqual(["A", "B", "C"]);
    });

    it("still merges duplicates even when at capacity", () => {
      const existing = [
        makeIngredient({ name: "A" }),
        makeIngredient({ name: "B" }),
        makeIngredient({ name: "C" }),
      ];
      const incoming = [
        makeIngredient({ name: "A", quantity: 2 }), // merges into existing
        makeIngredient({ name: "D" }), // would exceed limit
      ];

      const result = mergeDetectedIngredients(existing, incoming, 3);

      expect(result).toHaveLength(3);
      expect(result[0].quantity).toBe(3); // 1 + 2
      expect(result.map((i) => i.name)).toEqual(["A", "B", "C"]);
    });
  });

  describe("immutability", () => {
    it("does not mutate the existing array", () => {
      const existing = [makeIngredient({ name: "Tomato", quantity: 1 })];
      const originalQuantity = existing[0].quantity;

      mergeDetectedIngredients(existing, [
        makeIngredient({ name: "Tomato", quantity: 5 }),
      ]);

      expect(existing[0].quantity).toBe(originalQuantity);
    });

    it("does not mutate the incoming array", () => {
      const incoming = [makeIngredient({ name: "Salt", quantity: 1 })];
      const ref = incoming[0];

      mergeDetectedIngredients([], incoming);

      expect(incoming[0]).toBe(ref); // Same reference, not cloned in-place
    });
  });

  describe("edge cases", () => {
    it("handles empty existing list", () => {
      const incoming = [
        makeIngredient({ name: "Egg" }),
        makeIngredient({ name: "Flour" }),
      ];

      const result = mergeDetectedIngredients([], incoming);

      expect(result).toHaveLength(2);
    });

    it("handles empty incoming list", () => {
      const existing = [makeIngredient({ name: "Butter" })];

      const result = mergeDetectedIngredients(existing, []);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Butter");
    });

    it("handles both lists empty", () => {
      const result = mergeDetectedIngredients([], []);
      expect(result).toEqual([]);
    });

    it("handles multiple incoming duplicates for the same existing item", () => {
      const existing = [makeIngredient({ name: "Sugar", quantity: 1 })];
      const incoming = [
        makeIngredient({ name: "Sugar", quantity: 1 }),
        makeIngredient({ name: "Sugar", quantity: 1 }),
      ];

      const result = mergeDetectedIngredients(existing, incoming);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(3); // 1 + 1 + 1
    });

    it("uses default MAX_INGREDIENTS_PER_SESSION", () => {
      expect(MAX_INGREDIENTS_PER_SESSION).toBe(20);
    });
  });
});
