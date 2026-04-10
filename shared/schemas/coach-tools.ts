import { z } from "zod";

export const lookupNutritionParamsSchema = z.object({
  query: z.string().min(1).max(200),
});

export const searchRecipesParamsSchema = z.object({
  query: z.string().min(1).max(200),
  cuisine: z.string().optional(),
  diet: z.string().optional(),
  maxReadyTime: z.number().optional(),
  intolerances: z.string().optional(),
});

export const getDailyLogParamsSchema = z.object({
  date: z.string().optional(),
});

export const logFoodItemParamsSchema = z.object({
  description: z.string().min(1).max(500),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  servings: z.number().min(0.1).optional(),
});

export const getPantryItemsParamsSchema = z.object({
  includeExpiring: z.boolean().optional(),
});

export const getMealPlanParamsSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export const addToMealPlanParamsSchema = z.object({
  recipeId: z.number(),
  date: z.string(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  servings: z.number().optional(),
});

export const addToGroceryListParamsSchema = z.object({
  listId: z.number().optional(),
  listName: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.string().optional(),
      unit: z.string().optional(),
    }),
  ),
});

export const getSubstitutionsParamsSchema = z.object({
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.string().optional(),
      unit: z.string().optional(),
    }),
  ),
});

export const coachToolNames = [
  "lookup_nutrition",
  "search_recipes",
  "get_daily_log_details",
  "log_food_item",
  "get_pantry_items",
  "get_meal_plan",
  "add_to_meal_plan",
  "add_to_grocery_list",
  "get_substitutions",
] as const;

export type CoachToolName = (typeof coachToolNames)[number];
