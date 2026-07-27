"use client";

import { useState } from "react";
import type { FacetSelections, ProductFacetGroup } from "@/lib/search/productFacets";
import { cx } from "@/lib/utils";

export function ProductFacetControls({
  facets,
  selections,
  onToggle,
  onClear,
  layout = "grid",
}: {
  facets: ProductFacetGroup[];
  selections: FacetSelections;
  onToggle: (facetKey: string, optionValue: string) => void;
  onClear: () => void;
  layout?: "grid" | "stack";
}) {
  const [expanded, setExpanded] = useState(false);
  if (facets.length === 0) return null;
  const selectedCount = Object.values(selections).reduce((total, values) => total + values.length, 0);
  const visibleFacets = layout === "stack" || expanded
    ? facets
    : facets.filter((facet, index) => index < 6 || (selections[facet.key]?.length ?? 0) > 0);
  const hiddenCount = Math.max(0, facets.length - visibleFacets.length);

  return (
    <section
      aria-labelledby={layout === "grid" ? "smart-filters-heading" : "smart-filters-sheet-heading"}
      className={cx(
        "rounded-[1.35rem] border border-brand-blue/12 bg-gradient-to-l from-brand-blue-light/55 via-white to-white p-3.5",
        layout === "grid" && "md:p-4"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <h2
            id={layout === "grid" ? "smart-filters-heading" : "smart-filters-sheet-heading"}
            className="text-sm font-black text-graphite md:text-base"
          >
            פילטרים חכמים לבחירה מדויקת
          </h2>
          <p className="mt-0.5 text-xs text-graphite-soft/60">מוצגים רק מאפיינים שנמצאו בדגמים הפעילים</p>
        </div>
        {selectedCount > 0 && (
          <button type="button" onClick={onClear} className="shrink-0 text-xs font-bold text-brand-blue hover:underline">
            נקה מאפיינים
          </button>
        )}
      </div>

      <div className={cx(layout === "grid" ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3")}>
        {visibleFacets.map((facet) => (
          <fieldset key={facet.key} className="rounded-2xl border border-line/75 bg-white/90 p-3 shadow-[0_14px_35px_-32px_rgba(7,57,96,.55)]">
            <legend className="px-1 text-xs font-extrabold text-graphite-soft/72">{facet.label}</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {facet.options.map((option) => {
                const active = selections[facet.key]?.includes(option.value) ?? false;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onToggle(facet.key, option.value)}
                    aria-pressed={active}
                    disabled={option.count === 0 && !active}
                    className={cx(
                      "tap-target inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all",
                      active
                        ? "border-brand-blue bg-brand-blue text-white shadow-[0_10px_24px_-16px_rgba(11,87,147,.85)]"
                        : "border-line bg-white text-graphite hover:border-brand-blue/35 hover:text-brand-blue",
                      option.count === 0 && !active && "cursor-not-allowed opacity-35"
                    )}
                  >
                    {option.label}
                    <span className={cx("text-[10px] font-semibold", active ? "text-white/72" : "text-graphite-soft/48")}>
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      {layout === "grid" && facets.length > 6 && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="mx-auto mt-3 flex min-h-9 items-center gap-2 rounded-full border border-brand-blue/18 bg-white px-4 py-2 text-xs font-black text-brand-blue transition-colors hover:border-brand-blue/35"
        >
          {expanded ? "הצג פחות פילטרים" : `עוד ${hiddenCount || facets.length - 6} קבוצות סינון`}
          <span aria-hidden="true" className={cx("transition-transform", expanded && "rotate-180")}>⌄</span>
        </button>
      )}
    </section>
  );
}
