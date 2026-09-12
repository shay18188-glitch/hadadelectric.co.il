"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FitCandidate } from "@/lib/seo/catalogDimensions";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { cx } from "@/lib/utils";

/**
 * Matches a measured niche against the models the catalog publishes dimensions
 * for.
 *
 * The tool deliberately does not subtract a clearance for the visitor. Ventilation
 * and connection gaps differ by appliance and by installation, and silently
 * shaving 5 cm off every result would either hide models that do fit or promise
 * ones that do not. Instead it reports the gap each model leaves on every axis
 * and flags anything under 2 cm, so the decision stays with the person holding
 * the tape measure.
 */

const CATEGORY_LABELS: Record<string, string> = {
  refrigerators: "מקררים",
  freezers: "מקפיאים",
  "washing-machines": "מכונות כביסה",
  dryers: "מייבשי כביסה",
  dishwashers: "מדיחי כלים",
  ovens: "תנורים",
  cooktops: "כיריים",
  microwaves: "מיקרוגלים",
};

const TIGHT_CM = 2;

interface Match extends FitCandidate {
  gapW: number;
  gapH: number;
  gapD: number;
  tightest: number;
}

function parseCm(value: string): number | null {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function round(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export function NicheFitCalculator({ candidates }: { candidates: FitCandidate[] }) {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [depth, setDepth] = useState("");
  const [category, setCategory] = useState("");
  const [inStockOnly, setInStockOnly] = useState(true);

  const w = parseCm(width);
  const h = parseCm(height);
  const d = parseCm(depth);
  const hasAnyInput = w !== null || h !== null || d !== null;

  const categories = useMemo(() => {
    const present = new Set(candidates.map((c) => c.categorySlug));
    return Object.entries(CATEGORY_LABELS).filter(([slug]) => present.has(slug));
  }, [candidates]);

  const matches = useMemo<Match[]>(() => {
    if (!hasAnyInput) return [];
    return candidates
      .filter((c) => (category ? c.categorySlug === category : true))
      .filter((c) => (inStockOnly ? c.inStock : true))
      .filter((c) => (w === null || c.widthCm <= w) && (h === null || c.heightCm <= h) && (d === null || c.depthCm <= d))
      .map((c) => {
        const gapW = w === null ? Infinity : w - c.widthCm;
        const gapH = h === null ? Infinity : h - c.heightCm;
        const gapD = d === null ? Infinity : d - c.depthCm;
        return { ...c, gapW, gapH, gapD, tightest: Math.min(gapW, gapH, gapD) };
      })
      .sort((a, b) => b.tightest - a.tightest)
      .slice(0, 40);
  }, [candidates, category, inStockOnly, w, h, d, hasAnyInput]);

  const measuredTotal = candidates.length;

  return (
    <div className="mt-6">
      <div className="surface-card rounded-[1.5rem] p-5 md:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { id: "w", label: "רוחב הנישה", value: width, set: setWidth, example: "60" },
            { id: "h", label: "גובה פנוי", value: height, set: setHeight, example: "85" },
            { id: "d", label: "עומק עד הקיר", value: depth, set: setDepth, example: "60" },
          ].map((field) => (
            <div key={field.id}>
              <label htmlFor={`niche-${field.id}`} className="block text-sm font-semibold text-graphite">
                {field.label}
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id={`niche-${field.id}`}
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.1"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.example}
                  aria-label={`${field.label} בסנטימטרים`}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-base text-graphite focus:border-brand-blue focus:outline-none"
                />
                <span className="shrink-0 text-sm text-graphite-soft/70">ס״מ</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            aria-label="קטגוריה"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-graphite focus:border-brand-blue focus:outline-none"
          >
            <option value="">כל הקטגוריות</option>
            {categories.map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setInStockOnly((v) => !v)}
            aria-pressed={inStockOnly}
            className={cx(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              inStockOnly
                ? "border-success bg-success-bg text-success"
                : "border-line bg-white text-graphite hover:bg-surface"
            )}
          >
            רק דגמים זמינים
          </button>

          <p className="text-xs text-graphite-soft/60">
            אפשר למלא מידה אחת בלבד — למשל רק רוחב.
          </p>
        </div>
      </div>

      <div className="mt-6">
        {!hasAnyInput ? (
          <p className="text-sm text-graphite-soft/75">
            הזינו לפחות מידה אחת כדי לראות אילו מתוך {measuredTotal} הדגמים שפורסמו עבורם מידות מדויקות
            נכנסים.
          </p>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm font-semibold text-graphite">אף דגם לא נכנס במידות האלה</p>
            <p className="mt-1.5 text-sm leading-relaxed text-graphite-soft/80">
              אפשר לנסות בלי סינון הזמינות, או לוותר על אחת המידות. אם הנישה באמת צרה — שלחו לנו
              אותה בוואטסאפ ונבדוק מול דגמים שטרם פורסמו להם מידות בקטלוג.
            </p>
            <div className="mt-4">
              <WhatsAppButton
                message={`שלום, יש לי נישה במידות ${width || "?"} רוחב × ${height || "?"} גובה × ${depth || "?"} עומק (ס״מ). איזה דגם מתאים?`}
                label="לשלוח לנו את המידות"
                trackAs="whatsapp_click_product"
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-graphite-soft/75">
              {matches.length} דגמים נכנסים במידות שהזנתם, מסודרים לפי המרווח שהם משאירים.
            </p>
            {/* Phones get cards, not a table. At 375px a three-column table
                pushed the dimensions and the remaining-gap columns off-screen
                behind a horizontal scroll — hiding the two numbers the tool
                exists to produce, for the 64% of clicks that arrive on mobile. */}
            <ul className="mt-3 flex flex-col gap-2 sm:hidden">
              {matches.map((m) => {
                const tight = m.tightest < TIGHT_CM;
                return (
                  <li key={m.slug} className="rounded-2xl border border-line bg-white p-4">
                    <Link href={`/products/${m.slug}`} className="text-sm font-semibold text-graphite hover:text-brand-blue">
                      {m.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-graphite-soft/60">
                      {CATEGORY_LABELS[m.categorySlug] ?? m.categorySlug}
                      {m.brand ? ` · ${m.brand}` : ""}
                      {m.inStock ? "" : " · לא במלאי כרגע"}
                    </p>
                    <p className="mt-2 text-sm text-graphite-soft/85" dir="ltr">
                      {round(m.widthCm)} × {round(m.heightCm)} × {round(m.depthCm)} cm
                    </p>
                    <p className={cx("mt-1 text-sm", tight ? "text-warning-text" : "text-graphite-soft/85")}>
                      מרווח שנותר:{" "}
                      {[
                        w !== null ? `רוחב ${round(m.gapW)}` : null,
                        h !== null ? `גובה ${round(m.gapH)}` : null,
                        d !== null ? `עומק ${round(m.gapD)}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      {tight && <span className="mt-0.5 block text-xs">מרווח צר — בדקו אוורור וחיבורים</span>}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-line bg-white sm:block">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-surface text-xs text-graphite-soft/80">
                    <th className="p-3 text-right font-semibold">דגם</th>
                    <th className="p-3 text-right font-semibold">מידות (ר×ג×ע)</th>
                    <th className="p-3 text-right font-semibold">מרווח שנותר</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => {
                    const tight = m.tightest < TIGHT_CM;
                    return (
                      <tr key={m.slug} className="border-t border-line align-top">
                        <td className="p-3">
                          <Link href={`/products/${m.slug}`} className="font-medium text-graphite hover:text-brand-blue">
                            {m.name}
                          </Link>
                          <span className="mt-0.5 block text-xs text-graphite-soft/60">
                            {CATEGORY_LABELS[m.categorySlug] ?? m.categorySlug}
                            {m.brand ? ` · ${m.brand}` : ""}
                            {m.inStock ? "" : " · לא במלאי כרגע"}
                          </span>
                        </td>
                        <td className="p-3 text-graphite-soft/85" dir="ltr">
                          {round(m.widthCm)} × {round(m.heightCm)} × {round(m.depthCm)}
                        </td>
                        <td className={cx("p-3", tight ? "text-warning-text" : "text-graphite-soft/85")}>
                          {[
                            w !== null ? `רוחב ${round(m.gapW)}` : null,
                            h !== null ? `גובה ${round(m.gapH)}` : null,
                            d !== null ? `עומק ${round(m.gapD)}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                          {tight && <span className="mt-0.5 block text-xs">מרווח צר — בדקו אוורור וחיבורים</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
