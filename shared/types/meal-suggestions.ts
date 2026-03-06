export interface MealSuggestion {
  title: string;
  description: string;
  reasoning: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTimeMinutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: { name: string; quantity?: string; unit?: string }[];
  instructions: string;
  dietTags: string[];
}

export interface PopularPick {
  title: string;
  description: string | null;
  calories: string | null;
  protein: string | null;
  carbs: string | null;
  fat: string | null;
  prepTimeMinutes: number | null;
  difficulty: string | null;
  dietTags: string[];
  pickCount: number;
}

export interface MealSuggestionResponse {
  suggestions: MealSuggestion[];
  popularPicks: PopularPick[];
  remainingToday: number;
}
