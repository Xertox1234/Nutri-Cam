import { uploadAsync, FileSystemUploadType } from "expo-file-system/legacy";
import { tokenStorage } from "./token-storage";
import { getApiUrl } from "./query-client";
import { compressImage, cleanupImage } from "./image-compression";

// Types matching server response
export interface FoodItem {
  name: string;
  quantity: string;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
  nutrition: NutritionData | null;
}

export interface NutritionData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
  source: "calorieninjas" | "usda" | "cache";
}

export interface PhotoAnalysisResponse {
  sessionId: string;
  foods: FoodItem[];
  overallConfidence: number;
  needsFollowUp: boolean;
  followUpQuestions: string[];
}

export interface PhotoConfirmRequest {
  sessionId: string;
  foods: {
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  mealType?: string;
}

/**
 * Upload a photo for AI analysis
 *
 * Uses multipart/form-data upload (25-30% faster than base64 in JSON)
 * Automatically compresses image to under 1MB before upload
 */
export async function uploadPhotoForAnalysis(
  uri: string,
): Promise<PhotoAnalysisResponse> {
  const token = await tokenStorage.get();
  if (!token) {
    throw new Error("Not authenticated");
  }

  // Compress image before upload
  const compressed = await compressImage(uri);

  try {
    const uploadResult = await uploadAsync(
      `${getApiUrl()}/api/photos/analyze`,
      compressed.uri,
      {
        httpMethod: "POST",
        uploadType: FileSystemUploadType.MULTIPART,
        fieldName: "photo",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (uploadResult.status !== 200) {
      // Try to parse error message from response
      try {
        const errorData = JSON.parse(uploadResult.body);
        throw new Error(
          errorData.error || `Upload failed: ${uploadResult.status}`,
        );
      } catch {
        throw new Error(`Upload failed: ${uploadResult.status}`);
      }
    }

    return JSON.parse(uploadResult.body) as PhotoAnalysisResponse;
  } finally {
    // Clean up compressed image
    await cleanupImage(compressed.uri);
  }
}

/**
 * Submit a follow-up answer for an analysis session
 */
export async function submitFollowUp(
  sessionId: string,
  question: string,
  answer: string,
): Promise<PhotoAnalysisResponse> {
  const token = await tokenStorage.get();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${getApiUrl()}/api/photos/analyze/${sessionId}/followup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ question, answer }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Follow-up failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Confirm analysis and save to daily log
 */
export async function confirmPhotoAnalysis(
  request: PhotoConfirmRequest,
): Promise<{ id: number; productName: string }> {
  const token = await tokenStorage.get();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${getApiUrl()}/api/photos/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Confirm failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Calculate total nutrition from food items
 */
export function calculateTotals(foods: FoodItem[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return foods.reduce(
    (acc, food) => {
      if (food.nutrition) {
        return {
          calories: acc.calories + food.nutrition.calories,
          protein: acc.protein + food.nutrition.protein,
          carbs: acc.carbs + food.nutrition.carbs,
          fat: acc.fat + food.nutrition.fat,
        };
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
