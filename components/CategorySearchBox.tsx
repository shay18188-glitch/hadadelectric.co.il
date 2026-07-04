"use client";

import { useMemo, useState } from "react";
import type { Category } from "@/types/category";
import { CategoryTiles } from "@/components/CategoryTiles";
import { matchCategories } from "@/lib/search/categorySearch";

/**
 * Smart, instant category search: filters the tiles below as the user
 * types, fully client-side (no navigation, no query params added to the
 * URL) so it never creates a new indexable/filtered page. Supports partial
 * words, typos and appliance synonyms (see lib/search/categorySearch.ts).
 */
export function CategorySearchBox({
  categories,
  limit,
  placeholder = "חפשו קטגוריה… למשל מקרר, כביסה, תנור, מזגן",
}: {
  categories: Category[];
  limit?: number;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();

  const visible = useMemo(() => {
    if (!trimmed) return limit ? categories.slice(0, limit) : categories;
    return matchCategories(categories, trimmed, categories.length);
  }, [categories, limit, trimmed]);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 fill-none stroke-graphite-soft/60 stroke-2"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m20 20-3.5-3.5" />
        </svg>
        <label htmlFor="category-search" className="sr-only">
          חיפוש קטגוריה
        </label>
        <input
          id="category-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-line bg-white py-3 ps-4 pe-11 text-sm text-graphite shadow-sm outline-none placeholder:text-graphite-soft/50 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
        />
      </div>
      <CategoryTiles
        categories={visible}
        emptyMessage={trimmed ? `לא נמצאו קטגוריות התואמות ל"${trimmed}" — נסו מילה אחרת או קטגוריה קרובה.` : undefined}
      />
    </div>
  );
}
