"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import type { Category } from "@/types/category";
import type { Brand } from "@/types/brand";
import { trackEvent } from "@/lib/analytics";
import { BottomSheet } from "@/components/BottomSheet";
import { FilterCategorySearch } from "@/components/FilterCategorySearch";
import { cx } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "recommended", label: "מומלצים" },
  { value: "in-stock", label: "במלאי קודם" },
  { value: "newest", label: "חדשים" },
  { value: "alpha", label: "א׳-ת׳" },
];

export function Filters({ categories, brands }: { categories: Category[]; brands: Brand[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      trackEvent("filter_use", { key, value: value ?? "" });
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams, startTransition]
  );

  const category = searchParams.get("category") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const inStock = searchParams.get("inStock") === "true";
  const sort = searchParams.get("sort") ?? "recommended";
  const q = searchParams.get("q") ?? "";

  const activeChips: { key: string; label: string }[] = [];
  if (q) activeChips.push({ key: "q", label: `חיפוש: ${q}` });
  if (category) {
    const found = categories.find((c) => c.slug === category);
    activeChips.push({ key: "category", label: found?.name ?? category });
  }
  if (brand) {
    const found = brands.find((b) => b.slug === brand);
    activeChips.push({ key: "brand", label: found?.name ?? brand });
  }
  if (inStock) activeChips.push({ key: "inStock", label: "במלאי בלבד" });

  const activeFilterCount = [category, brand, inStock].filter(Boolean).length;

  function renderFields(layout: "grid" | "stack") {
    return (
      <div className={layout === "grid" ? "grid grid-cols-2 gap-3 md:grid-cols-4" : "flex flex-col gap-4"}>
        <FilterCategorySearch
          categories={categories}
          value={category}
          onChange={(v) => updateParam("category", v || null)}
          layout={layout}
        />
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
        <label className="tap-target flex items-center gap-2 self-end rounded-xl border border-line bg-white px-3 py-3 text-sm text-graphite">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParam("inStock", e.target.checked ? "true" : null)}
            className="h-4 w-4 rounded border-line text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue"
          />
          במלאי בלבד
        </label>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="hidden md:block">{renderFields("grid")}</div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-graphite shadow-sm active:bg-surface"
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

      {activeChips.length > 0 && (
        <div className="scroll-x-fade flex items-center gap-2 md:flex-wrap">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => updateParam(chip.key, null)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-graphite hover:bg-surface-strong"
            >
              {chip.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="shrink-0 text-xs font-semibold text-brand-blue hover:underline"
          >
            נקה סינון
          </button>
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} placement="bottom" title="סינון ומיון">
        <div className="p-5">{renderFields("stack")}</div>
        <div className="sticky bottom-0 border-t border-line bg-white p-4">
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className={cx(
              "tap-target inline-flex w-full items-center justify-center rounded-full bg-graphite px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-graphite-soft"
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
    <label className="flex flex-col gap-1 text-xs font-medium text-graphite-soft/70">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tap-target rounded-xl border border-line bg-white px-3 py-3 text-sm text-graphite outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
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
