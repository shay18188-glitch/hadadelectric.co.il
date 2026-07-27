"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "@/types/category";
import { CategoryIcon } from "@/components/CategoryIcon";
import { matchCategories } from "@/lib/search/categorySearch";
import { cx } from "@/lib/utils";

/**
 * Smart category picker for filter sheets: type to find categories by Hebrew
 * name, partial words, typos, or appliance synonyms — no new indexable URLs.
 */
export function FilterCategorySearch({
  categories,
  value,
  onChange,
  layout = "stack",
  pending = false,
}: {
  categories: Category[];
  value: string;
  onChange: (slug: string) => void;
  layout?: "grid" | "stack";
  pending?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const trimmed = query.trim();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (layout === "grid" && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [layout]);

  const visible = useMemo(() => {
    if (!trimmed) return categories.slice(0, 10);
    return matchCategories(categories, trimmed, 10);
  }, [categories, trimmed]);

  const selected = categories.find((c) => c.slug === value);

  if (layout === "grid") {
    return (
      <div className="relative flex flex-col gap-1" ref={containerRef}>
        <label className="text-sm font-bold text-graphite-soft/78">קטגוריה</label>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-busy={pending}
          className="tap-target flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-3 text-base text-graphite outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
        >
          <span className="truncate">{selected ? selected.name : "הכל"}</span>
          {pending ? (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand-blue/20 border-t-brand-blue" aria-hidden="true" />
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-graphite-soft/70 stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          )}
        </button>

        {open && (
          <div className="absolute top-[110%] z-40 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
            <div className="border-b border-line p-2">
              <div className="relative">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-graphite-soft/60 stroke-2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" d="m20 20-3.5-3.5" />
                </svg>
                <input
                  type="search"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="חיפוש קטגוריה…"
                  className="w-full rounded-lg bg-surface py-2 pe-2 ps-8 text-sm text-graphite outline-none placeholder:text-graphite-soft/50 focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>
            </div>
            <ul className="flex max-h-64 flex-col overflow-y-auto p-1">
              {!trimmed && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cx(
                      "flex w-full items-center rounded-lg px-3 py-2 text-start text-sm transition-colors",
                      !value ? "bg-brand-blue-light/50 font-semibold text-brand-blue" : "text-graphite hover:bg-surface"
                    )}
                  >
                    הכל
                  </button>
                </li>
              )}
              {visible.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-graphite-soft/60">לא נמצאו קטגוריות</li>
              ) : (
                visible.map((category) => (
                  <li key={category.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(category.slug);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cx(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors",
                        value === category.slug
                          ? "bg-brand-blue-light/50 font-semibold text-brand-blue"
                          : "text-graphite hover:bg-surface"
                      )}
                    >
                      <span className="flex-1 truncate">{category.name}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-bold text-graphite-soft/78">קטגוריה</label>

      {selected && !trimmed && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-busy={pending}
          className="tap-target flex items-center gap-2.5 rounded-xl border border-brand-blue/30 bg-brand-blue-light/50 px-3 py-2.5 text-sm font-semibold text-brand-blue"
        >
          <CategoryIcon name={selected.name} className="h-4 w-4" />
          {selected.name}
          {pending ? (
            <span className="mr-auto inline-flex items-center gap-1.5 text-xs font-medium opacity-80">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-blue/20 border-t-brand-blue" aria-hidden="true" />
              מעדכן…
            </span>
          ) : (
            <span className="mr-auto text-xs font-medium opacity-70">×</span>
          )}
        </button>
      )}

      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-graphite-soft/60 stroke-2"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חפשו קטגוריה… מקרר, כביסה, תנור"
          className="tap-target w-full rounded-xl border border-line bg-white py-3 pe-3 ps-10 text-base text-graphite outline-none placeholder:text-graphite-soft/50 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
        />
      </div>

      <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
        {!trimmed && !value && (
          <li>
            <button
              type="button"
              onClick={() => onChange("")}
              className={cx(
                "tap-target w-full rounded-xl px-3 py-2.5 text-start text-sm font-medium transition-colors",
                !value ? "bg-surface text-graphite" : "text-graphite-soft/80 hover:bg-surface"
              )}
            >
              הכל
            </button>
          </li>
        )}
        {visible.length === 0 ? (
          <li className="px-3 py-4 text-center text-sm text-graphite-soft/60">לא נמצאו קטגוריות</li>
        ) : (
          visible.map((category) => (
            <li key={category.slug}>
              <button
                type="button"
                onClick={() => {
                  onChange(category.slug);
                  setQuery("");
                }}
                className={cx(
                  "tap-target flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm font-medium transition-colors",
                  value === category.slug
                    ? "bg-brand-blue-light text-brand-blue"
                    : "text-graphite hover:bg-surface"
                )}
              >
                <CategoryIcon name={category.name} className="h-4 w-4 shrink-0" />
                <span className="flex-1">{category.name}</span>
                <span className="text-xs text-graphite-soft/50">{category.productCount}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
