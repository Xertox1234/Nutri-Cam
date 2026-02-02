import { z } from "zod";

// Validate user input with Zod
export const userPhysicalProfileSchema = z.object({
  weight: z.number().min(20).max(500), // kg, reasonable bounds
  height: z.number().min(50).max(300), // cm, reasonable bounds
  age: z.number().int().min(13).max(120),
  gender: z.enum(["male", "female", "other"]),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "athlete",
  ]),
  primaryGoal: z.enum([
    "lose_weight",
    "gain_muscle",
    "maintain",
    "eat_healthier",
    "manage_condition",
  ]),
});

export type UserPhysicalProfile = z.infer<typeof userPhysicalProfileSchema>;

export interface CalculatedGoals {
  dailyCalories: number;
  dailyProtein: number; // grams
  dailyCarbs: number; // grams
  dailyFat: number; // grams
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

const GOAL_MODIFIERS: Record<string, number> = {
  lose_weight: -500,
  gain_muscle: 300,
  maintain: 0,
  eat_healthier: 0,
  manage_condition: 0,
};

const MACRO_SPLITS: Record<
  string,
  { protein: number; carbs: number; fat: number }
> = {
  lose_weight: { protein: 0.4, carbs: 0.3, fat: 0.3 },
  gain_muscle: { protein: 0.35, carbs: 0.4, fat: 0.25 },
  maintain: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  eat_healthier: { protein: 0.3, carbs: 0.45, fat: 0.25 },
  manage_condition: { protein: 0.3, carbs: 0.4, fat: 0.3 },
};

// Minimum safe calorie intake
const MIN_DAILY_CALORIES = 1200;

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor formula
 */
function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: string,
): number {
  // Mifflin-St Jeor formula
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;

  if (gender === "male") {
    return baseBMR + 5;
  } else {
    // female and other use female formula as it's more conservative
    return baseBMR - 161;
  }
}

/**
 * Calculate Total Daily Energy Expenditure
 */
function calculateTDEE(bmr: number, activityLevel: string): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return bmr * multiplier;
}

/**
 * Calculate daily nutrition goals from physical profile
 */
export function calculateGoals(profile: UserPhysicalProfile): CalculatedGoals {
  const bmr = calculateBMR(
    profile.weight,
    profile.height,
    profile.age,
    profile.gender,
  );
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  // Apply goal modifier
  const modifier = GOAL_MODIFIERS[profile.primaryGoal] || 0;
  let dailyCalories = Math.round(tdee + modifier);

  // Safety guardrail: minimum calorie intake
  dailyCalories = Math.max(MIN_DAILY_CALORIES, dailyCalories);

  // Get macro split for goal
  const split = MACRO_SPLITS[profile.primaryGoal] || MACRO_SPLITS.maintain;

  return {
    dailyCalories,
    dailyProtein: Math.round((dailyCalories * split.protein) / 4), // 4 cal/g protein
    dailyCarbs: Math.round((dailyCalories * split.carbs) / 4), // 4 cal/g carbs
    dailyFat: Math.round((dailyCalories * split.fat) / 9), // 9 cal/g fat
  };
}

/**
 * Validate partial profile for goal calculation
 * Returns missing fields needed to calculate goals
 */
export function getMissingProfileFields(
  profile: Partial<UserPhysicalProfile>,
): string[] {
  const missing: string[] = [];

  if (profile.weight === undefined || profile.weight === null) {
    missing.push("weight");
  }
  if (profile.height === undefined || profile.height === null) {
    missing.push("height");
  }
  if (profile.age === undefined || profile.age === null) {
    missing.push("age");
  }
  if (!profile.gender) {
    missing.push("gender");
  }
  if (!profile.activityLevel) {
    missing.push("activityLevel");
  }
  if (!profile.primaryGoal) {
    missing.push("primaryGoal");
  }

  return missing;
}
