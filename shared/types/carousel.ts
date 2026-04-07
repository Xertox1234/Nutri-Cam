export interface CarouselRecipeCard {
  /** Community recipe ID */
  id: number;
  title: string;
  imageUrl: string | null;
  prepTimeMinutes: number | null;
  recommendationReason: string;
}

export interface CarouselResponse {
  cards: CarouselRecipeCard[];
}

export interface CarouselDismissRequest {
  recipeId: number;
}
