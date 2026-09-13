"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FitCandidate } from "@/lib/seo/catalogDimensions";
import { NicheFitDiagram, gapQuality } from "@/components/NicheFitDiagram";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { cx } from "@/lib/utils";

/**
 * Matches a measured gap against the models the catalog publishes dimensions
 * for.
 *
 * Two decisions shape the whole screen. The first is that clearance is opt-in
 * rather than silent: ventilation and connection gaps differ by appliance and
 * by installation, so subtracting a fixed few centimetres from every result
 * would either hide models that do fit or promise ones that do not. The tool
 * reports the gap each model leaves and offers a switch that applies the usual
 * allowances, so the arithmetic stays visible and the decision stays with the
 * person holding the tape measure.
 *
 * The second is that the numbers get drawn. "3 ס״מ clearance" reads as
 * comfortable until you see it to scale, and judging that is the whole task.
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

/** Allowances applied when "כולל מרווח" is on: a side each way, and behind. */
const CLEARANCE = { side: 2, top: 2, back: 5 };

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
function r1(n: number): string {
  return String(Math.round(n * 10) / 10);
}

const FIT_LABEL = { roomy: "מרווח", snug: "מתאים", tight: "צמוד" } as const;
const FIT_CLASS = {
  roomy: "bg-success-bg text-success",
  snug: "bg-brand-blue-light text-brand-blue",
  tight: "bg-warning-bg text-warning-text",
} as const;

export function NicheFitCalculator({ candidates }: { candidates: FitCandidate[] }) {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [depth, setDepth] = useState("");
  const [category, setCategory] = useState("");
  const [inStockOnly, setInStockOnly] = useState(true);
  const [withClearance, setWithClearance] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  // Sorting by leftover space put a 20-litre microwave at the top of a
  // 62 × 87 × 62 niche, which is true and useless: someone who measured a gap
  // usually wants the largest thing that fits it. "Best fit" therefore ranks by
  // the smallest comfortable margin first and pushes anything under the tight
  // threshold to the end, where it belongs but can still be found.
  const [sort, setSort] = useState<"fit" | "room">("fit");

  const w = parseCm(width);
  const h = parseCm(height);
  const d = parseCm(depth);
  const hasAnyInput = w !== null || h !== null || d !== null;

  // Usable opening once the allowances are taken off, when that is switched on.
  const uw = w === null ? null : withClearance ? w - CLEARANCE.side * 2 : w;
  const uh = h === null ? null : withClearance ? h - CLEARANCE.top : h;
  const ud = d === null ? null : withClearance ? d - CLEARANCE.back : d;

  const categories = useMemo(() => {
    const present = new Set(candidates.map((c) => c.categorySlug));
    return Object.entries(CATEGORY_LABELS).filter(([slug]) => present.has(slug));
  }, [candidates]);

  const matches = useMemo<Match[]>(() => {
    if (!hasAnyInput) return [];
    return candidates
      .filter((c) => (category ? c.categorySlug === category : true))
      .filter((c) => (inStockOnly ? c.inStock : true))
      .filter(
        (c) =>
          (uw === null || c.widthCm <= uw) &&
          (uh === null || c.heightCm <= uh) &&
          (ud === null || c.depthCm <= ud)
      )
      .map((c) => {
        const gapW = uw === null ? Infinity : uw - c.widthCm;
        const gapH = uh === null ? Infinity : uh - c.heightCm;
        const gapD = ud === null ? Infinity : ud - c.depthCm;
        return { ...c, gapW, gapH, gapD, tightest: Math.min(gapW, gapH, gapD) };
      })
      .sort((a, b) => {
        if (sort === "room") return b.tightest - a.tightest;
        const aTight = a.tightest < 2;
        const bTight = b.tightest < 2;
        if (aTight !== bTight) return aTight ? 1 : -1;
        return a.tightest - b.tightest;
      })
      .slice(0, 40);
  }, [candidates, category, inStockOnly, uw, uh, ud, hasAnyInput, sort]);

  const shown = matches.find((m) => m.slug === selected) ?? matches[0] ?? null;

  const fields = [
    { id: "w", label: "רוחב הנישה", value: width, set: setWidth, example: "60" },
    { id: "h", label: "גובה פנוי", value: height, set: setHeight, example: "85" },
    { id: "d", label: "עומק עד הקיר", value: depth, set: setDepth, example: "60" },
  ];

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      {/* controls */}
      <div className="surface-card rounded-[1.5rem] p-5 md:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {fields.map((field) => (
            <div key={field.id}>
              <label htmlFor={`niche-${field.id}`} className="block text-sm font-semibold text-graphite">
                {field.label}
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-brand-blue">
                <input
                  id={`niche-${field.id}`}
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.1"
                  value={field.value}
                  onChange={(e) => {
                    field.set(e.target.value);
                    setSelected(null);
                  }}
                  placeholder={field.example}
                  aria-label={`${field.label} בסנטימטרים`}
                  className="w-full bg-transparent py-2.5 text-lg font-semibold tabular-nums text-graphite outline-none"
                />
                <span className="shrink-0 text-sm text-graphite-soft/60">ס״מ</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <select
            aria-label="קטגוריה"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSelected(null);
            }}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite focus:border-brand-blue focus:outline-none"
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
              "tap-target rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              inStockOnly
                ? "border-success bg-success-bg text-success"
                : "border-line bg-white text-graphite hover:bg-surface"
            )}
          >
            רק במלאי
          </button>

          <select
            aria-label="סדר תוצאות"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value === "room" ? "room" : "fit");
              setSelected(null);
            }}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite focus:border-brand-blue focus:outline-none"
          >
            <option value="fit">מתאים ביותר</option>
            <option value="room">הכי מרווח</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setWithClearance((v) => !v);
              setSelected(null);
            }}
            aria-pressed={withClearance}
            className={cx(
              "tap-target rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              withClearance
                ? "border-brand-blue bg-brand-blue-light text-brand-blue"
                : "border-line bg-white text-graphite hover:bg-surface"
            )}
          >
            כולל מרווח התקנה
          </button>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-graphite-soft/65">
          {withClearance
            ? `מחושב על פתח קטן יותר: ${CLEARANCE.side} ס״מ לכל צד, ${CLEARANCE.top} ס״מ מעל ו־${CLEARANCE.back} ס״מ מאחור לצנרת ולחשמל. ההוראות של הדגם עצמו גוברות.`
            : "אפשר למלא מידה אחת בלבד. הפעילו ״כולל מרווח התקנה״ כדי לבדוק מול פתח מוקטן."}
        </p>

      </div>

      {/* live diagram — placed between the controls and the results so that on a
          phone, where everything stacks, the drawing is the first feedback a
          person sees rather than sitting under forty rows */}
      <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
        <div className="surface-card rounded-[1.5rem] p-5">
          <p className="text-sm font-bold text-graphite">{shown ? "כך זה ייראה" : "מה מודדים"}</p>
          <p className="mt-1 text-xs leading-relaxed text-graphite-soft/65">
            {shown
              ? "הנישה והדגם באותו קנה מידה. המספרים הם המרווח שנשאר."
              : "מודדים את הפתח עצמו — רוחב, גובה פנוי ועומק עד הקיר."}
          </p>
          <div className="mt-3">
            <NicheFitDiagram
              nicheW={uw}
              nicheH={uh}
              nicheD={ud}
              product={shown ? { name: shown.name, w: shown.widthCm, h: shown.heightCm, d: shown.depthCm } : null}
            />
          </div>
        </div>
      </aside>

      {/* results */}
      <div className="surface-card rounded-[1.5rem] p-5 md:p-6 lg:col-span-2">
          {!hasAnyInput ? (
            <p className="text-sm text-graphite-soft/75">
              הזינו לפחות מידה אחת כדי לראות אילו מתוך {candidates.length} הדגמים שפורסמו עבורם מידות
              מדויקות נכנסים.
            </p>
          ) : matches.length === 0 ? (
            <div>
              <p className="text-sm font-semibold text-graphite">אף דגם לא נכנס במידות האלה</p>
              <p className="mt-1.5 text-sm leading-relaxed text-graphite-soft/80">
                {withClearance
                  ? "נסו לכבות את מרווח ההתקנה כדי לראות מה נכנס בפתח עצמו, "
                  : "אפשר לוותר על אחת המידות או לבטל את סינון המלאי, "}
                או לשלוח לנו את המידות ונבדוק מול דגמים שטרם פורסמו להם מידות.
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
                <strong className="font-semibold text-graphite">{matches.length} דגמים</strong> נכנסים,
                {sort === "fit" ? "מהמנצל את המקום בצורה הטובה ביותר" : "מהמרווח ביותר"}. בחרו דגם כדי לראות אותו בתרשים.
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {matches.map((m) => {
                  const q = gapQuality(m.tightest);
                  const isShown = shown?.slug === m.slug;
                  return (
                    <li key={m.slug}>
                      <button
                        type="button"
                        onClick={() => setSelected(m.slug)}
                        aria-pressed={isShown}
                        className={cx(
                          "w-full rounded-2xl border p-3.5 text-right transition-colors",
                          isShown
                            ? "border-brand-blue bg-brand-blue-light/50"
                            : "border-line bg-white hover:border-brand-blue/40"
                        )}
                      >
                        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="flex-1 text-sm font-semibold text-graphite">{m.name}</span>
                          <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold", FIT_CLASS[q])}>
                            {FIT_LABEL[q]}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs text-graphite-soft/60">
                          {CATEGORY_LABELS[m.categorySlug] ?? m.categorySlug}
                          {m.brand ? ` · ${m.brand}` : ""}
                          {m.inStock ? "" : " · לא במלאי כרגע"}
                        </span>
                        <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-graphite-soft/85">
                          <span dir="ltr">{r1(m.widthCm)} × {r1(m.heightCm)} × {r1(m.depthCm)} cm</span>
                          <span>
                            נשאר:{" "}
                            {[
                              uw !== null ? `רוחב ${r1(m.gapW)}` : null,
                              uh !== null ? `גובה ${r1(m.gapH)}` : null,
                              ud !== null ? `עומק ${r1(m.gapD)}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {shown && (
                <p className="mt-4 text-sm">
                  <Link href={`/products/${shown.slug}`} className="font-semibold text-brand-blue hover:underline">
                    למפרט המלא של {shown.name} ←
                  </Link>
                </p>
              )}
            </>
          )}
      </div>
    </div>
  );
}
