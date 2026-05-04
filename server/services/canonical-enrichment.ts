/**
 * Canonical recipe enrichment pipeline.
 *
 * Stub — implemented in Task 5.
 * This file exists so that canonical-promotion.ts can import it; the real
 * enrichment logic will be added here in the next task.
 */

/**
 * Enrich a newly-promoted canonical recipe.
 * Called fire-and-forget by the promotion job; failures are caught and logged
 * by the caller.
 */
export async function enrichRecipe(_recipeId: number): Promise<void> {
  // Task 5 will implement: image generation, nutrition analysis, tag
  // normalisation, and any other enrichment steps required for canonical recipes.
}
