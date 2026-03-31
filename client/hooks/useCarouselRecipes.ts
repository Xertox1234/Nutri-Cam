import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import type { CarouselSource, CarouselResponse } from "@shared/types/carousel";

const CAROUSEL_KEY = ["/api/carousel"];

export function useCarouselRecipes() {
  return useQuery<CarouselResponse>({
    queryKey: CAROUSEL_KEY,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useSaveCarouselRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      recipeId: string;
      source: CarouselSource;
      title: string;
      description?: string;
      instructions?: string;
      difficulty?: string;
      timeEstimate?: string;
    }) => {
      const res = await apiRequest("POST", "/api/carousel/save", params);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-items"] });
    },
  });
}

export function useDismissCarouselRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      recipeId: string;
      source: CarouselSource;
    }) => {
      const res = await apiRequest("POST", "/api/carousel/dismiss", params);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
    },
    onMutate: async ({ recipeId }) => {
      // Optimistically remove the card from the carousel
      await queryClient.cancelQueries({ queryKey: CAROUSEL_KEY });
      const previous = queryClient.getQueryData<CarouselResponse>(CAROUSEL_KEY);

      queryClient.setQueryData<CarouselResponse>(CAROUSEL_KEY, (old) => {
        if (!old) return old;
        return {
          cards: old.cards.filter((c) => c.id !== recipeId),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Roll back on failure
      if (context?.previous) {
        queryClient.setQueryData(CAROUSEL_KEY, context.previous);
      }
    },
  });
}
