import Fuse from "fuse.js";
import type { Category } from "@/types/category";
import { expandWithSynonyms, normalizeHebrewSearch, SEARCH_SYNONYMS } from "@/lib/search/normalizeHebrew";

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

  const normalizedQuery = normalizeHebrewSearch(trimmed);
  const expandedTerms = new Set(expandWithSynonyms(trimmed));
  const semanticCategorySlugs = new Set<string>();
  const exactCategorySlugs = new Set<string>();
  if (/(?:מכונת|מכונות)\s+כביסה/.test(normalizedQuery)) {
    exactCategorySlugs.add("washing-machines");
  } else if (/מייבש(?:י)?\s+כביסה/.test(normalizedQuery)) {
    exactCategorySlugs.add("dryers");
  }
  // Category matching intentionally drops size/capacity modifiers. Product
  // search preserves them, while here "טלוויזיה 50 אינץ" must still identify
  // the "טלוויזיות" category so the UI can offer its size shortcuts.
  for (const group of SEARCH_SYNONYMS) {
    const normalizedGroup = group.map(normalizeHebrewSearch);
    if (normalizedGroup.some((term) => normalizedQuery.includes(term))) {
      normalizedGroup.forEach((term) => expandedTerms.add(term));
      for (const category of categories) {
        const name = normalizeHebrewSearch(category.name);
        if (normalizedGroup.some((term) => name.includes(term) || term.includes(name))) {
          semanticCategorySlugs.add(category.slug);
        }
      }
    }
  }
  const seen = new Map<string, { category: Category; score: number }>();

  for (const term of expandedTerms) {
    for (const { item, score = 1 } of fuse.search(term)) {
      const existing = seen.get(item.slug);
      if (!existing || score < existing.score) {
        seen.set(item.slug, { category: item, score });
      }
    }
  }

  for (const category of categories) {
    const normalizedName = normalizeHebrewSearch(category.name);
    if (normalizedQuery.length >= 2 && (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName))) {
      const existing = seen.get(category.slug);
      if (!existing || existing.score > 0.02) {
        seen.set(category.slug, { category, score: 0.01 });
      }
    }
  }

  const ranked = Array.from(seen.values())
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.category);
  const focused = exactCategorySlugs.size > 0
    ? ranked.filter((category) => exactCategorySlugs.has(category.slug))
    : semanticCategorySlugs.size > 0
    ? ranked.filter((category) => semanticCategorySlugs.has(category.slug))
    : ranked;

  return focused
    .slice(0, limit);
}
