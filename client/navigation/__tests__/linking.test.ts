import { describe, it, expect } from "vitest";
import { linking } from "../linking";

describe("linking config", () => {
  it("includes both custom scheme and universal link prefixes", () => {
    expect(linking.prefixes).toContain("ocrecipes://");
    expect(linking.prefixes).toContain("https://ocrecipes.app");
  });

  it("configures RecipeDetail path with numeric parse", () => {
    const recipeDetail =
      // @ts-expect-error — nested screen config typing is loosely indexed
      linking.config!.screens.Main.screens.MealPlanTab.screens.RecipeDetail;

    expect(recipeDetail.path).toBe("recipe/:recipeId");
    expect(recipeDetail.parse.recipeId("42")).toBe(42);
  });

  it("configures Chat path with numeric parse", () => {
    const chat =
      // @ts-expect-error — nested screen config typing is loosely indexed
      linking.config!.screens.Main.screens.CoachTab.screens.Chat;

    expect(chat.path).toBe("chat/:conversationId");
    expect(chat.parse.conversationId("7")).toBe(7);
  });

  it("configures NutritionDetail as a path string", () => {
    expect(linking.config!.screens.NutritionDetail).toBe("nutrition/:barcode");
  });

  it("configures Scan as a path string", () => {
    expect(linking.config!.screens.Scan).toBe("scan");
  });

  it("returns NaN when parse receives a non-numeric string", () => {
    const recipeDetail =
      // @ts-expect-error — nested screen config typing is loosely indexed
      linking.config!.screens.Main.screens.MealPlanTab.screens.RecipeDetail;

    expect(recipeDetail.parse.recipeId("abc")).toBeNaN();
  });
});
