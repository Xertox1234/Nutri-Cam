import type { MealSuggestion } from "./meal-suggestions";
import type { CatalogSearchResult } from "./recipe-catalog";

export type CarouselSource = "ai" | "catalog" | "community";

export interface CarouselRecipeCard {
  /** Unique identifier: "community:42", "catalog:12345", or "ai:<hash>" */
  id: string;
  source: CarouselSource;
  title: string;
  imageUrl: string | null;
  prepTimeMinutes: number | null;
  recommendationReason: string;
  /** Full recipe data for detail navigation (shape varies by source) */
  recipeData: MealSuggestion | CatalogSearchResult | CommunityRecipeSnapshot;
}

/** Lightweight snapshot of a community recipe for carousel navigation */
export interface CommunityRecipeSnapshot {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  difficulty: string | null;
  timeEstimate: string | null;
  servings: number | null;
  dietTags: string[];
  instructions: string[];
}

export interface CarouselResponse {
  cards: CarouselRecipeCard[];
}

export interface CarouselSaveRequest {
  recipeId: string;
  source: CarouselSource;
  title: string;
  description?: string;
  instructions?: string[];
  difficulty?: string;
  timeEstimate?: string;
}

export interface CarouselDismissRequest {
  recipeId: string;
  source: CarouselSource;
}
