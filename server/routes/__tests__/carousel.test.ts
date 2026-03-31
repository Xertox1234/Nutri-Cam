import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

import { storage } from "../../storage";
import { register } from "../carousel";
import { buildCarousel } from "../../services/carousel-builder";

vi.mock("../../middleware/auth");

vi.mock("../../services/carousel-builder", () => ({
  buildCarousel: vi.fn(),
}));

vi.mock("../../storage", () => ({
  storage: {
    getUserProfile: vi.fn(),
    getSubscriptionStatus: vi.fn(),
    createSavedItem: vi.fn(),
    dismissRecipe: vi.fn(),
  },
}));

function createApp() {
  const app = express();
  app.use(express.json());
  register(app);
  return app;
}

const mockCards = [
  {
    id: "community:1",
    source: "community" as const,
    title: "Pasta Primavera",
    imageUrl: "https://example.com/pasta.jpg",
    prepTimeMinutes: 25,
    recommendationReason: "Recently added recipe",
    recipeData: { id: 1, title: "Pasta Primavera" },
  },
  {
    id: "community:2",
    source: "community" as const,
    title: "Grilled Salmon",
    imageUrl: null,
    prepTimeMinutes: 30,
    recommendationReason: "Matches your keto diet",
    recipeData: { id: 2, title: "Grilled Salmon" },
  },
];

describe("Carousel Routes", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe("GET /api/carousel", () => {
    it("returns carousel cards", async () => {
      vi.mocked(storage.getSubscriptionStatus).mockResolvedValue({
        tier: "free",
        expiresAt: null,
      });
      vi.mocked(storage.getUserProfile).mockResolvedValue(undefined);
      vi.mocked(buildCarousel).mockResolvedValue(mockCards);

      const res = await request(app).get("/api/carousel");

      expect(res.status).toBe(200);
      expect(res.body.cards).toHaveLength(2);
      expect(res.body.cards[0].title).toBe("Pasta Primavera");
      expect(buildCarousel).toHaveBeenCalledWith("1", null, false);
    });

    it("passes isPremium=true for premium users", async () => {
      vi.mocked(storage.getSubscriptionStatus).mockResolvedValue({
        tier: "premium",
        expiresAt: new Date("2027-01-01"),
      });
      vi.mocked(storage.getUserProfile).mockResolvedValue(undefined);
      vi.mocked(buildCarousel).mockResolvedValue([]);

      await request(app).get("/api/carousel");

      expect(buildCarousel).toHaveBeenCalledWith("1", null, true);
    });

    it("returns empty cards array when no recipes available", async () => {
      vi.mocked(storage.getSubscriptionStatus).mockResolvedValue({
        tier: "free",
        expiresAt: null,
      });
      vi.mocked(storage.getUserProfile).mockResolvedValue(undefined);
      vi.mocked(buildCarousel).mockResolvedValue([]);

      const res = await request(app).get("/api/carousel");

      expect(res.status).toBe(200);
      expect(res.body.cards).toEqual([]);
    });
  });

  describe("POST /api/carousel/save", () => {
    it("saves a recipe to saved items", async () => {
      vi.mocked(storage.createSavedItem).mockResolvedValue({
        id: 1,
        userId: "1",
        type: "recipe",
        title: "Pasta Primavera",
        description: null,
        difficulty: null,
        timeEstimate: null,
        instructions: null,
        sourceItemId: null,
        sourceProductName: null,
        createdAt: new Date(),
      });

      const res = await request(app).post("/api/carousel/save").send({
        recipeId: "community:1",
        source: "community",
        title: "Pasta Primavera",
      });

      expect(res.status).toBe(201);
      expect(storage.createSavedItem).toHaveBeenCalledWith("1", {
        type: "recipe",
        title: "Pasta Primavera",
        description: undefined,
        instructions: undefined,
        difficulty: undefined,
        timeEstimate: undefined,
      });
    });

    it("returns 400 for missing required fields", async () => {
      const res = await request(app)
        .post("/api/carousel/save")
        .send({ source: "community" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("returns 403 when saved items limit reached", async () => {
      vi.mocked(storage.createSavedItem).mockResolvedValue(null);

      const res = await request(app).post("/api/carousel/save").send({
        recipeId: "community:1",
        source: "community",
        title: "Pasta Primavera",
      });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/carousel/dismiss", () => {
    it("dismisses a recipe", async () => {
      vi.mocked(storage.dismissRecipe).mockResolvedValue(undefined);

      const res = await request(app).post("/api/carousel/dismiss").send({
        recipeId: "community:1",
        source: "community",
      });

      expect(res.status).toBe(204);
      expect(storage.dismissRecipe).toHaveBeenCalledWith(
        "1",
        "community:1",
        "community",
      );
    });

    it("returns 400 for invalid source", async () => {
      const res = await request(app).post("/api/carousel/dismiss").send({
        recipeId: "community:1",
        source: "invalid",
      });

      expect(res.status).toBe(400);
    });

    it("returns 400 for missing recipeId", async () => {
      const res = await request(app)
        .post("/api/carousel/dismiss")
        .send({ source: "community" });

      expect(res.status).toBe(400);
    });
  });
});
