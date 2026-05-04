/**
 * Canonical recipe promotion background job.
 *
 * Runs every 6 hours. Queries community recipes that have crossed the
 * popularity threshold (via storage.getEligibleForPromotion), marks them
 * canonical, then fire-and-forgets the enrichment pipeline for each one.
 *
 * The enrichment pipeline (canonical-enrichment.ts) is implemented in Task 5
 * and is decoupled — its failures are logged individually and do not block
 * promotion from completing.
 *
 * Usage: call startPromotionJob() once at server startup.
 */
import pLimit from "p-limit";
import { createServiceLogger, toError } from "../lib/logger";
import { storage } from "../storage";
import { enrichRecipe } from "./canonical-enrichment";

const log = createServiceLogger("canonical-promotion");

const PROMOTION_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const ENRICHMENT_CONCURRENCY = 2;

/**
 * Query eligible recipes, mark each canonical, and fire-and-forget enrichment.
 * Exported for testing and manual invocation.
 */
export async function runPromotionJob(): Promise<void> {
  const eligible = await storage.getEligibleForPromotion(10);

  if (eligible.length === 0) return;

  log.info(
    { count: eligible.length },
    "canonical-promotion: promoting recipes",
  );

  const limit = pLimit(ENRICHMENT_CONCURRENCY);

  await Promise.all(
    eligible.map((recipe) =>
      limit(async () => {
        await storage.markCanonical(recipe.id);
        enrichRecipe(recipe.id).catch((err) => {
          log.error(
            { err: toError(err), recipeId: recipe.id },
            "canonical-promotion: enrichment failed for recipe",
          );
        });
      }),
    ),
  );
}

/**
 * Start the 6-hour promotion interval.
 * Returns the interval handle so callers can clear it if needed.
 */
export function startPromotionJob(): ReturnType<typeof setInterval> {
  log.info(
    { intervalMs: PROMOTION_INTERVAL_MS },
    "canonical-promotion: starting promotion job (6h interval)",
  );

  return setInterval(() => {
    runPromotionJob().catch((err) => {
      log.error(
        { err: toError(err) },
        "canonical-promotion: unhandled error in promotion job",
      );
    });
  }, PROMOTION_INTERVAL_MS);
}
