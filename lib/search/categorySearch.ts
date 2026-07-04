import Fuse from "fuse.js";
import type { Category } from "@/types/category";
import { expandWithSynonyms, normalizeHebrewSearch } from "@/lib/search/normalizeHebrew";

/**
 * Smart category matching: Hebrew-aware fuzzy search + synonym expansion +
 * substring safety net, so short/partial queries like "מקרר" reliably find
 * "מקררים", "כביסה" finds both washer & dryer categories, "גז"/"אינדוקציה"
 * find "כיריים", etc. Client- and server-safe (no I/O), so it can run both
 * in the search API route and directly in client components for instant
 * in-page filtering without creating new indexable URLs.
 */
export function matchCategories(categories: Category[], query: string, limit = 6): Category[] {
  const trimmed = query.trim();
  if (!trimmed || categories.length === 0) return [];

  const fuse = new Fuse(categories, {
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [{ name: "name", weight: 1 }],
  });

  const expandedTerms = expandWithSynonyms(trimmed);
  const seen = new Map<string, { category: Category; score: number }>();

  for (const term of expandedTerms) {
    for (const { item, score = 1 } of fuse.search(term)) {
      const existing = seen.get(item.slug);
      if (!existing || score < existing.score) {
        seen.set(item.slug, { category: item, score });
      }
    }
  }

  const normalizedQuery = normalizeHebrewSearch(trimmed);
  for (const category of categories) {
    const normalizedName = normalizeHebrewSearch(category.name);
    if (normalizedQuery.length >= 2 && (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName))) {
      const existing = seen.get(category.slug);
      if (!existing || existing.score > 0.02) {
        seen.set(category.slug, { category, score: 0.01 });
      }
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.category)
    .slice(0, limit);
}
