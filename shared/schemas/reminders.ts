import { z } from "zod";
import type { CoachContextItem } from "../types/reminders";

export const coachContextItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("meal-log"),
    lastLoggedAt: z.string().nullable(),
  }),
  z.object({
    type: z.literal("commitment"),
    notebookEntryId: z.number(),
    content: z.string(),
  }),
  z.object({
    type: z.literal("daily-checkin"),
    calories: z.number(),
  }),
  z.object({
    type: z.literal("user-set"),
    message: z.string(),
  }),
]) satisfies z.ZodType<CoachContextItem>;
