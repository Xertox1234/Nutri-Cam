import { z } from "zod";

export const PlatformSchema = z.enum(["ios", "android"]);
export type Platform = z.infer<typeof PlatformSchema>;

export const UpgradeRequestSchema = z.object({
  receipt: z.string().min(1, "Receipt is required"),
  platform: PlatformSchema,
  productId: z.string().min(1, "Product ID is required"),
  transactionId: z.string().min(1, "Transaction ID is required"),
});
export type UpgradeRequest = z.infer<typeof UpgradeRequestSchema>;

export const RestoreRequestSchema = z.object({
  platform: PlatformSchema,
  receipts: z.array(
    z.object({
      receipt: z.string().min(1),
      transactionId: z.string().min(1),
      productId: z.string().min(1),
    }),
  ),
});
export type RestoreRequest = z.infer<typeof RestoreRequestSchema>;

export const UpgradeResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    tier: z.enum(["free", "premium"]),
    expiresAt: z.string().datetime(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    code: z
      .enum([
        "INVALID_RECEIPT",
        "ALREADY_PROCESSED",
        "VALIDATION_ERROR",
        "SERVER_ERROR",
      ])
      .optional(),
  }),
]);
export type UpgradeResponse = z.infer<typeof UpgradeResponseSchema>;

export const RestoreResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    tier: z.enum(["free", "premium"]),
    expiresAt: z.string().datetime().nullable(),
    restoredCount: z.number(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    code: z
      .enum(["NO_PURCHASES_FOUND", "VALIDATION_ERROR", "SERVER_ERROR"])
      .optional(),
  }),
]);
export type RestoreResponse = z.infer<typeof RestoreResponseSchema>;
