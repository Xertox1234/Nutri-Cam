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
    id: 1,
    title: "Pasta Primavera",
    imageUrl: "https://example.com/pasta.jpg",
    prepTimeMinutes: 25,
    recommendationReason: "Recently added recipe",
  },
  {
    id: 2,
    title: "Grilled Salmon",
    imageUrl: null,
    prepTimeMinutes: 30,
    recommendationReason: "Matches your keto diet",
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
      vi.mocked(storage.getUserProfile).mockResolvedValue(undefined);
      vi.mocked(buildCarousel).mockResolvedValue(mockCards);

      const res = await request(app).get("/api/carousel");

      expect(res.status).toBe(200);
      expect(res.body.cards).toHaveLength(2);
      expect(res.body.cards[0].title).toBe("Pasta Primavera");
      expect(buildCarousel).toHaveBeenCalledWith("1", null);
    });

    it("returns empty cards array when no recipes available", async () => {
      vi.mocked(storage.getUserProfile).mockResolvedValue(undefined);
      vi.mocked(buildCarousel).mockResolvedValue([]);

      const res = await request(app).get("/api/carousel");

      expect(res.status).toBe(200);
      expect(res.body.cards).toEqual([]);
    });
  });

  describe("POST /api/carousel/dismiss", () => {
    it("dismisses a recipe", async () => {
      vi.mocked(storage.dismissRecipe).mockResolvedValue(undefined);

      const res = await request(app).post("/api/carousel/dismiss").send({
        recipeId: 1,
      });

      expect(res.status).toBe(204);
      expect(storage.dismissRecipe).toHaveBeenCalledWith("1", 1);
    });

    it("returns 400 for non-numeric recipeId", async () => {
      const res = await request(app).post("/api/carousel/dismiss").send({
        recipeId: "community:1",
      });

      expect(res.status).toBe(400);
    });

    it("returns 400 for missing recipeId", async () => {
      const res = await request(app).post("/api/carousel/dismiss").send({});

      expect(res.status).toBe(400);
    });
  });
});
