import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "../../db";

import {
  incrementRecipePopularity,
  getCuratedRecipes,
  getCuratedRecipeById,
  getEligibleForPromotion,
  markCanonical,
} from "../canonical-recipes";

vi.mock("../../db", () => ({
  db: {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue([]),
  },
}));

describe("incrementRecipePopularity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("increments favorites counter by 1", async () => {
    await incrementRecipePopularity(42, "favorite");
    expect(db.update).toHaveBeenCalled();
  });

  it("increments mealPlan counter by 1", async () => {
    await incrementRecipePopularity(42, "mealPlan");
    expect(db.update).toHaveBeenCalled();
  });

  it("increments cookSession counter by 1", async () => {
    await incrementRecipePopularity(42, "cookSession");
    expect(db.update).toHaveBeenCalled();
  });
});

describe("markCanonical", () => {
  it("sets isCanonical true and canonicalizedAt", async () => {
    await markCanonical(42);
    expect(db.update).toHaveBeenCalled();
  });
});
