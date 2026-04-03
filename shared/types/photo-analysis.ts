/**
 * Shared types for photo analysis results.
 * Used by both server (photo-analysis service, storage/sessions) and
 * any future client consumers.
 */
import type { FoodCategory } from "../constants/preparation";

export interface FoodItem {
  name: string;
  quantity: string;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
  category?: FoodCategory;
  cuisine?: string;
}

export interface AnalysisResult {
  foods: FoodItem[];
  overallConfidence: number;
  followUpQuestions: string[];
}
