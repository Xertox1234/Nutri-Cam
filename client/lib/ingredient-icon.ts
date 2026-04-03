import { ImageSourcePropType } from "react-native";

import {
  categoryIconMap,
  ingredientIconMap,
  ingredientNameToSlug,
} from "../data/ingredient-icon-map";

// ── Normalization helpers ───────────────────────────────────────────────────

const STRIP_PREFIXES = [
  "fresh ",
  "organic ",
  "dried ",
  "ground ",
  "chopped ",
  "diced ",
  "sliced ",
  "minced ",
  "frozen ",
  "canned ",
  "raw ",
  "cooked ",
  "roasted ",
  "grilled ",
  "steamed ",
  "smoked ",
  "crushed ",
  "whole ",
  "boneless ",
  "skinless ",
  "extra virgin ",
  "low-fat ",
  "fat-free ",
  "unsalted ",
];

/** Simple depluralize — strips trailing 's' / 'es' for common cases */
function depluralize(word: string): string {
  if (word.endsWith("ies") && word.length > 4) {
    return word.slice(0, -3) + "y"; // berries → berry
  }
  if (word.endsWith("ves") && word.length > 4) {
    return word.slice(0, -3) + "f"; // halves → half (edge case)
  }
  if (word.endsWith("es") && word.length > 3) {
    return word.slice(0, -2); // tomatoes → tomato
  }
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 2) {
    return word.slice(0, -1); // carrots → carrot
  }
  return word;
}

function normalize(input: string): string {
  let name = input.toLowerCase().trim();
  for (const prefix of STRIP_PREFIXES) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length);
    }
  }
  return name.trim();
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ── Pre-compute slug lookup arrays ──────────────────────────────────────────

const slugEntries = Object.entries(ingredientNameToSlug);

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Look up an ingredient icon by name with fuzzy matching.
 *
 * Match strategy (first hit wins):
 * 1. Exact slug match
 * 2. Normalized name (strip prefixes) → slug match
 * 3. Depluralized → slug match
 * 4. Substring: check if any known ingredient name appears in the input
 */
export function getIngredientIcon(name: string): ImageSourcePropType | null {
  if (!name) return null;

  const normalized = normalize(name);
  const slug = toSlug(normalized);

  // 1. Direct slug match
  if (ingredientIconMap[slug]) return ingredientIconMap[slug];

  // 2. Name→slug lookup (handles multi-word names like "bell pepper")
  const mappedSlug = ingredientNameToSlug[normalized];
  if (mappedSlug && ingredientIconMap[mappedSlug]) {
    return ingredientIconMap[mappedSlug];
  }

  // 3. Depluralized
  const singular = depluralize(normalized);
  const singularSlug = toSlug(singular);
  if (ingredientIconMap[singularSlug]) return ingredientIconMap[singularSlug];

  const singularMapped = ingredientNameToSlug[singular];
  if (singularMapped && ingredientIconMap[singularMapped]) {
    return ingredientIconMap[singularMapped];
  }

  // 4. Substring match — check if any known ingredient is contained in the input
  // Prefer longer matches (e.g., "sweet potato" over "potato")
  let bestMatch: { slug: string; len: number } | null = null;
  for (const [entryName, entrySlug] of slugEntries) {
    if (
      normalized.includes(entryName) &&
      (!bestMatch || entryName.length > bestMatch.len)
    ) {
      bestMatch = { slug: entrySlug, len: entryName.length };
    }
  }
  if (bestMatch && ingredientIconMap[bestMatch.slug]) {
    return ingredientIconMap[bestMatch.slug];
  }

  return null;
}

/**
 * Look up a category icon. Falls back to "category-other".
 */
export function getCategoryIcon(
  category: string | undefined,
): ImageSourcePropType | null {
  if (!category) {
    return categoryIconMap["category-other"] ?? null;
  }

  const key = `category-${category.toLowerCase()}`;
  return categoryIconMap[key] ?? categoryIconMap["category-other"] ?? null;
}
