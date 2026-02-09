import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { ApiError } from "@/lib/api-error";
import type { MealSuggestionResponse } from "@shared/types/meal-suggestions";

export function useMealSuggestions() {
  return useMutation({
    mutationFn: async (params: {
      date: string;
      mealType: string;
    }): Promise<MealSuggestionResponse> => {
      const res = await apiRequest("POST", "/api/meal-plan/suggest", params);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new ApiError(body.error || `${res.status}`, body.code);
      }
      return res.json();
    },
  });
}
