import { z } from "zod";
import { subscriptionTierSchema } from "../types/premium";

export const PlatformSchema = z.enum(["ios", "android"]);

export const UpgradeRequestSchema = z.object({
  receipt: z.string().min(1, "Receipt is required"),
  platform: PlatformSchema,
  productId: z.string().min(1, "Product ID is required"),
  transactionId: z.string().min(1, "Transaction ID is required"),
});

export const UpgradeResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    tier: subscriptionTierSchema,
    expiresAt: z.string().nullable(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    code: z.string().optional(),
  }),
]);

export const RestoreRequestSchema = UpgradeRequestSchema.pick({
  receipt: true,
  platform: true,
});

export type Platform = z.infer<typeof PlatformSchema>;
export type UpgradeRequest = z.infer<typeof UpgradeRequestSchema>;
export type RestoreRequest = z.infer<typeof RestoreRequestSchema>;
export type UpgradeResponse = z.infer<typeof UpgradeResponseSchema>;
