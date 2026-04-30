/**
 * Push token registration endpoint.
 *
 * POST /api/push-tokens — register or rotate an Expo push token for the
 * authenticated user. Called by the client after login whenever a push token
 * is obtained from expo-notifications.
 *
 * Idempotent: repeated calls with the same token for the same platform are
 * no-ops (upsert on (userId, platform)).
 */
import type { Express, Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { storage } from "../storage";
import { handleRouteError } from "./_helpers";
import { crudRateLimit } from "./_rate-limiters";

const registerTokenSchema = z.object({
  token: z.string().min(1).max(500),
  platform: z.enum(["ios", "android"]),
});

export function register(app: Express): void {
  app.post(
    "/api/push-tokens",
    requireAuth,
    crudRateLimit,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { token, platform } = registerTokenSchema.parse(req.body);
        const row = await storage.upsertPushToken(req.userId, token, platform);
        res.status(200).json({ id: row.id });
      } catch (err) {
        handleRouteError(res, err, "register push token");
      }
    },
  );

  app.delete(
    "/api/push-tokens",
    requireAuth,
    crudRateLimit,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const schema = z.object({ token: z.string().min(1).max(500) });
        const { token } = schema.parse(req.body);
        await storage.deletePushToken(req.userId, token);
        res.json({ success: true });
      } catch (err) {
        handleRouteError(res, err, "delete push token");
      }
    },
  );
}
