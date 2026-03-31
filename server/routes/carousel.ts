import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { buildCarousel } from "../services/carousel-builder";
import { sendError } from "../lib/api-errors";
import {
  crudRateLimit,
  getPremiumFeatures,
  handleRouteError,
  formatZodError,
} from "./_helpers";

const dismissSchema = z.object({
  recipeId: z.string().min(1),
  source: z.enum(["ai", "catalog", "community"]),
});

const saveSchema = z.object({
  recipeId: z.string().min(1),
  source: z.enum(["ai", "catalog", "community"]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(10000).optional(),
  difficulty: z.string().max(50).optional(),
  timeEstimate: z.string().max(50).optional(),
});

export function register(app: Express): void {
  // ── GET /api/carousel ────────────────────────────────────
  app.get(
    "/api/carousel",
    requireAuth,
    crudRateLimit,
    async (req: AuthenticatedRequest, res) => {
      try {
        const features = await getPremiumFeatures(req);
        const isPremium = features.aiMealSuggestions === true;

        const userProfile = (await storage.getUserProfile(req.userId!)) ?? null;

        const cards = await buildCarousel(req.userId!, userProfile, isPremium);

        res.json({ cards });
      } catch (error) {
        handleRouteError(res, error, "carousel:get");
      }
    },
  );

  // ── POST /api/carousel/save ──────────────────────────────
  app.post(
    "/api/carousel/save",
    requireAuth,
    crudRateLimit,
    async (req: AuthenticatedRequest, res) => {
      try {
        const parsed = saveSchema.safeParse(req.body);
        if (!parsed.success) {
          sendError(res, 400, formatZodError(parsed.error));
          return;
        }

        const { title, description, instructions, difficulty, timeEstimate } =
          parsed.data;

        const savedItem = await storage.createSavedItem(req.userId!, {
          type: "recipe",
          title,
          description,
          instructions,
          difficulty,
          timeEstimate,
        });

        if (!savedItem) {
          sendError(
            res,
            403,
            "Saved items limit reached for your subscription tier",
          );
          return;
        }

        res.status(201).json(savedItem);
      } catch (error) {
        handleRouteError(res, error, "carousel:save");
      }
    },
  );

  // ── POST /api/carousel/dismiss ───────────────────────────
  app.post(
    "/api/carousel/dismiss",
    requireAuth,
    crudRateLimit,
    async (req: AuthenticatedRequest, res) => {
      try {
        const parsed = dismissSchema.safeParse(req.body);
        if (!parsed.success) {
          sendError(res, 400, formatZodError(parsed.error));
          return;
        }

        await storage.dismissRecipe(
          req.userId!,
          parsed.data.recipeId,
          parsed.data.source,
        );

        res.status(204).send();
      } catch (error) {
        handleRouteError(res, error, "carousel:dismiss");
      }
    },
  );
}
