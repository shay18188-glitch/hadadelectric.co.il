"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useOptimistic, useState, useTransition } from "react";
import type { Category } from "@/types/category";
import type { Brand } from "@/types/brand";
import { trackEvent } from "@/lib/analytics";
import { BottomSheet } from "@/components/BottomSheet";
import { FilterCategorySearch } from "@/components/FilterCategorySearch";
import { ProductFacetControls } from "@/components/ProductFacetControls";
import { cx } from "@/lib/utils";
import type { QuickSearchFilter } from "@/lib/search/quickFilters";
import {
  FACET_PARAM_PREFIX,
  facetOptionLabel,
  facetParamKey,
  parseFacetSelections,
  type ProductFacetGroup,
} from "@/lib/search/productFacets";

const SORT_OPTIONS = [
  { value: "recommended", label: "מומלצים" },
  { value: "in-stock", label: "במלאי קודם" },
  { value: "newest", label: "חדשים" },
  { value: "alpha", label: "א׳-ת׳" },
];

export function Filters({
  categories,
  brands,
  quickFilters = [],
  facets = [],
  fixedCategory,
}: {
  categories: Category[];
  brands: Brand[];
  quickFilters?: QuickSearchFilter[];
  facets?: ProductFacetGroup[];
  fixedCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const categoryFromUrl = fixedCategory ?? searchParams.get("category") ?? "";
  const [optimisticCategory, setOptimisticCategory] = useOptimistic(categoryFromUrl);
  const [sheetOpen, setSheetOpen] = useState(searchParams.get("panel") === "filters");

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (sheetOpen) params.set("panel", "filters");
      trackEvent("filter_use", { key, value: value ?? "" });
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams, sheetOpen, startTransition]
  );

  const applyQuickFilter = useCallback(
    (filter: QuickSearchFilter) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const key of Array.from(next.keys())) {
        if (key.startsWith(FACET_PARAM_PREFIX)) next.delete(key);
      }
      next.set("category", filter.categorySlug);
      next.set("q", filter.query);
      trackEvent("filter_use", { key: "quick", value: `${filter.categorySlug}:${filter.query}` });
      startTransition(() => {
        setOptimisticCategory(filter.categorySlug);
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams, setOptimisticCategory, startTransition]
  );

  const category = optimisticCategory;
  const brand = searchParams.get("brand") ?? "";
  // In-stock products are the useful default. The URL only records the
  // shopper's explicit choice to include products that are currently unavailable.
  const inStock = searchParams.get("inStock") !== "false";
  const sort = searchParams.get("sort") ?? "recommended";
  const q = searchParams.get("q") ?? "";
  const facetSelections = parseFacetSelections(Object.fromEntries(searchParams.entries()));

  const toggleFacet = useCallback(
    (facetKey: string, optionValue: string) => {
      const next = new URLSearchParams(searchParams.toString());
      const param = facetParamKey(facetKey);
      const current = (next.get(param) ?? "").split(",").filter(Boolean);
      const values = current.includes(optionValue)
        ? current.filter((value) => value !== optionValue)
        : [...current, optionValue];
      if (values.length > 0) next.set(param, values.join(","));
      else next.delete(param);
      if (sheetOpen) next.set("panel", "filters");
      trackEvent("filter_use", { key: facetKey, value: optionValue });
      startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
    },
    [pathname, router, searchParams, sheetOpen, startTransition]
  );

  const clearFacetSelections = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of Array.from(next.keys())) {
      if (key.startsWith(FACET_PARAM_PREFIX)) next.delete(key);
    }
    if (sheetOpen) next.set("panel", "filters");
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }, [pathname, router, searchParams, sheetOpen, startTransition]);

  const updateCategory = useCallback((value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of Array.from(next.keys())) {
      if (key.startsWith(FACET_PARAM_PREFIX)) next.delete(key);
    }
    if (value) next.set("category", value);
    else next.delete("category");
    if (sheetOpen) next.set("panel", "filters");
    trackEvent("filter_use", { key: "category", value });
    startTransition(() => {
      setOptimisticCategory(value);
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }, [pathname, router, searchParams, setOptimisticCategory, sheetOpen, startTransition]);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    if (searchParams.get("panel") !== "filters") return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("panel");
    const href = next.size > 0 ? `${pathname}?${next.toString()}` : pathname;
    startTransition(() => router.replace(href, { scroll: false }));
  }, [pathname, router, searchParams, setSheetOpen, startTransition]);

  const activeChips: { key: string; paramKey: string; label: string; facetKey?: string; optionValue?: string }[] = [];
  if (q) activeChips.push({ key: "q", paramKey: "q", label: `חיפוש: ${q}` });
  if (category && !fixedCategory) {
    const found = categories.find((c) => c.slug === category);
    activeChips.push({ key: "category", paramKey: "category", label: found?.name ?? category });
  }
  if (brand) {
    const found = brands.find((b) => b.slug === brand);
    activeChips.push({ key: "brand", paramKey: "brand", label: found?.name ?? brand });
  }
  if (!inStock) activeChips.push({ key: "inStock", paramKey: "inStock", label: "כולל מוצרים שאינם במלאי" });
  for (const [facetKey, values] of Object.entries(facetSelections)) {
    for (const value of values) {
      activeChips.push({
        key: `${facetParamKey(facetKey)}:${value}`,
        paramKey: facetParamKey(facetKey),
        label: facetOptionLabel(facets, facetKey, value),
        facetKey,
        optionValue: value,
      });
    }
  }

  const facetFilterCount = Object.values(facetSelections).reduce((total, values) => total + values.length, 0);
  const activeFilterCount = [fixedCategory ? "" : category, brand, !inStock].filter(Boolean).length + facetFilterCount;

  function renderFields(layout: "grid" | "stack") {
    return (
      <div className={layout === "grid" ? cx("grid grid-cols-2 gap-3", fixedCategory ? "md:grid-cols-3" : "md:grid-cols-4") : "flex flex-col gap-4"}>
        {!fixedCategory && (
          <FilterCategorySearch
            categories={categories}
            value={category}
            onChange={updateCategory}
            layout={layout}
            pending={isPending}
          />
        )}
        <FilterSelect
          label="מותג"
          value={brand}
          onChange={(v) => updateParam("brand", v || null)}
          options={brands.map((b) => ({ value: b.slug, label: b.name }))}
        />
        <FilterSelect
          label="מיון"
          value={sort}
          onChange={(v) => updateParam("sort", v === "recommended" ? null : v)}
          options={SORT_OPTIONS}
          allowEmpty={false}
        />
        <label className="tap-target flex items-center gap-2 self-end rounded-xl border border-line bg-white px-3 py-3 text-base text-graphite">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParam("inStock", e.target.checked ? null : "false")}
            className="h-4 w-4 rounded border-line text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue"
          />
          במלאי בלבד
        </label>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="hidden md:flex md:flex-col md:gap-4">
        {renderFields("grid")}
        <ProductFacetControls
          facets={facets}
          selections={facetSelections}
          onToggle={toggleFacet}
          onClear={clearFacetSelections}
        />
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-3 text-base font-semibold text-graphite shadow-sm active:bg-surface"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          סינון ומיון
          {activeFilterCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-blue px-1 text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {quickFilters.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-extrabold text-graphite-soft/65">קיצורי דרך פופולריים בקטגוריה</p>
          <div className="scroll-x-fade flex gap-2 md:flex-wrap">
            {quickFilters.map((filter) => {
              const active = category === filter.categorySlug && q === filter.query;
              return (
                <button
                  key={`${filter.categorySlug}-${filter.query}`}
                  type="button"
                  onClick={() => applyQuickFilter(filter)}
                  aria-pressed={active}
                  className={cx(
                    "tap-target inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition-colors",
                    active
                      ? "border-brand-blue bg-brand-blue text-white"
                      : "border-brand-gold/30 bg-[#fffaf0] text-graphite hover:border-brand-gold"
                  )}
                >
                  {filter.label}
                  <span className={cx("text-xs font-medium", active ? "text-white/70" : "text-graphite-soft/55")}>({filter.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeChips.length > 0 && (
        <div className="scroll-x-fade flex items-center gap-2 md:flex-wrap">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => chip.facetKey && chip.optionValue
                ? toggleFacet(chip.facetKey, chip.optionValue)
                : updateParam(chip.paramKey, null)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-graphite hover:bg-surface-strong"
            >
              {chip.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="shrink-0 text-sm font-semibold text-brand-blue hover:underline"
          >
            נקה סינון
          </button>
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={closeSheet} placement="bottom" title="סינון ומיון">
        <div className="flex flex-col gap-5 p-5">
          {renderFields("stack")}
          <ProductFacetControls
            facets={facets}
            selections={facetSelections}
            onToggle={toggleFacet}
            onClear={clearFacetSelections}
            layout="stack"
          />
        </div>
        <div className="sticky bottom-0 border-t border-line bg-white p-4">
          <button
            type="button"
            onClick={closeSheet}
            className={cx(
              "tap-target inline-flex w-full items-center justify-center rounded-full bg-graphite px-5 py-3.5 text-base font-bold text-white transition-colors hover:bg-graphite-soft"
            )}
          >
            הצג תוצאות
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allowEmpty = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allowEmpty?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-bold text-graphite-soft/78">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tap-target rounded-xl border border-line bg-white px-3 py-3 text-base text-graphite outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
      >
        {allowEmpty && <option value="">הכל</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
