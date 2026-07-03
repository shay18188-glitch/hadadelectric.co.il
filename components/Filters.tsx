"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import type { Category } from "@/types/category";
import type { Brand } from "@/types/brand";
import { trackEvent } from "@/lib/analytics";

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

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <FilterSelect
          label="קטגוריה"
          value={category}
          onChange={(v) => updateParam("category", v || null)}
          options={categories.map((c) => ({ value: c.slug, label: c.name }))}
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
        <label className="flex items-center gap-2 self-end rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-graphite">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParam("inStock", e.target.checked ? "true" : null)}
            className="h-4 w-4 rounded border-line text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue"
          />
          במלאי בלבד
        </label>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => updateParam(chip.key, null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-graphite hover:bg-surface-strong"
            >
              {chip.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="text-xs font-semibold text-brand-blue hover:underline"
          >
            נקה סינון
          </button>
        </div>
      )}
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
        className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-graphite outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
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
