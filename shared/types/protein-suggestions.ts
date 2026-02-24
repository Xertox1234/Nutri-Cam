export interface ProteinSuggestion {
  title: string;
  description: string;
  proteinGrams: number;
  calories: number;
  portionSize: string;
}

export interface ProteinSuggestionsResponse {
  suggestions: ProteinSuggestion[];
  remainingProtein: number;
  proteinGoal: number;
}
