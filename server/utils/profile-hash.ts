import crypto from "crypto";
import type { UserProfile } from "@shared/schema";

/**
 * Calculate a hash of the user profile fields that affect AI-generated suggestions.
 * Used to invalidate cache when dietary preferences change.
 */
export function calculateProfileHash(profile: UserProfile | undefined): string {
  const hashInput = JSON.stringify({
    allergies: profile?.allergies ?? [],
    dietType: profile?.dietType ?? null,
    cookingSkillLevel: profile?.cookingSkillLevel ?? null,
    cookingTimeAvailable: profile?.cookingTimeAvailable ?? null,
  });
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}
