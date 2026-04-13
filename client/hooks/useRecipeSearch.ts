import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import type {
  RecipeSearchParams,
  RecipeSearchResponse,
} from "@shared/types/recipe-search";

export function useRecipeSearch(params: RecipeSearchParams | null) {
  const qs = params
    ? new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "" && v !== false)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";

  return useQuery<RecipeSearchResponse>({
    queryKey: ["/api/recipes/search", params ?? {}],
    queryFn: async () => {
      const url = qs ? `/api/recipes/search?${qs}` : "/api/recipes/search";
      const res = await apiRequest("GET", url);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    enabled: params !== null,
  });
}
