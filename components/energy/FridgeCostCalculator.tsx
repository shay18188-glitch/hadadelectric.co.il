"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FridgeCandidate } from "@/lib/energy/catalogEnergy";
import { NumberField, ResultPanel, ToggleChips, parseNum } from "@/components/energy/CalcFields";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { TARIFF_AGOROT_INC_VAT, fmt, ils } from "@/lib/energy/tariff";
import { cx } from "@/lib/utils";

/**
 * What the old refrigerator costs to keep, against what each model on the
 * shelf would cost instead.
 *
 * The comparison runs on the one number that survives the 2021 relabelling —
 * annual kWh — and only for models whose sheet publishes it. That is a third
 * of the category, and the screen says how many it is comparing so nobody
 * mistakes the list for the whole catalog.
 */

type Scope = "refrigerators" | "freezers";

export function FridgeCostCalculator({ candidates }: { candidates: FridgeCandidate[] }) {
  const [oldKwh, setOldKwh] = useState("600");
  const [years, setYears] = useState("12");
  const [tariff, setTariff] = useState(String(TARIFF_AGOROT_INC_VAT));
  const [scope, setScope] = useState<Scope>("refrigerators");
  const [inStockOnly, setInStockOnly] = useState(true);

  const old = parseNum(oldKwh);
  const y = parseNum(years);
  const t = parseNum(tariff);
  const valid = old !== null && old > 0 && y !== null && y > 0 && t !== null && t > 0;
  const rate = (t ?? 0) / 100;

  const list = useMemo(
    () => candidates.filter((c) => c.categorySlug === scope && (inStockOnly ? c.inStock : true)),
    [candidates, scope, inStockOnly]
  );
  const best = list[0] ?? null;

  let result: { primary: string; rows: { label: string; value: string }[]; notes: string[] } | null = null;
  if (valid) {
    const rows = [
      { label: "צריכה בחודש", value: `${fmt(old / 12, 1)} קוט״ש` },
      { label: "עלות בחודש", value: ils((old / 12) * rate) },
    ];
    if (best) {
      const saving = (old - best.annualKwh) * rate;
      rows.push(
        { label: `הדגם החסכוני ביותר ברשימה (${fmt(best.annualKwh, 0)} קוט״ש)`, value: `${ils(best.annualKwh * rate)} בשנה` },
        { label: "חיסכון שנתי מולו", value: saving > 0 ? ils(saving) : "אין חיסכון" },
        { label: `חיסכון ב־${fmt(y, 0)} שנים`, value: saving > 0 ? ils(saving * y) : "—" }
      );
    }
    result = {
      primary: ils(old * rate),
      rows,
      notes: [
        "הצריכה השנתית מופיעה בתווית האנרגיה, מתחת לאות הדירוג — ובמקרר ישן, לרוב על מדבקה בתוך תא הקירור.",
        "אין תווית? מד צריכה לשקע (נמכר בכמה עשרות שקלים) למשך שבוע, כפול 52, נותן מספר אמין יותר מכל הערכה.",
      ],
    };
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="surface-card rounded-[1.5rem] p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              id="fridge-old"
              label="צריכה שנתית של המקרר הנוכחי"
              unit="קוט״ש"
              value={oldKwh}
              onChange={setOldKwh}
              min={1}
              help="מהתווית. מקרר גדול בן 15 שנה ומעלה צורך לא פעם 500–800 קוט״ש בשנה."
            />
            <NumberField id="fridge-years" label="כמה שנים תחזיקו את המקרר החדש" unit="שנים" value={years} onChange={setYears} min={1} step={1} />
            <NumberField id="fridge-tariff" label="תעריף כולל מע״מ" unit="אג׳/קוט״ש" value={tariff} onChange={setTariff} />
          </div>
        </div>
        <div className="lg:sticky lg:top-24">
          <ResultPanel primaryLabel="המקרר הנוכחי עולה לכם בשנה" primaryValue={result?.primary ?? null} rows={result?.rows} notes={result?.notes} />
        </div>
      </div>

      <section className="surface-card rounded-[1.5rem] p-5 md:p-6" aria-labelledby="fridge-list-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="fridge-list-heading" className="text-lg font-black text-graphite md:text-xl">
            כמה עולה להפעיל כל דגם בקטלוג
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleChips<Scope>
              label="קטגוריה"
              value={scope}
              onChange={setScope}
              options={[
                { value: "refrigerators", label: "מקררים" },
                { value: "freezers", label: "מקפיאים" },
              ]}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setInStockOnly((v) => !v)}
            aria-pressed={inStockOnly}
            className={cx(
              "tap-target rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              inStockOnly ? "border-success bg-success-bg text-success" : "border-line bg-white text-graphite hover:bg-surface"
            )}
          >
            רק במלאי
          </button>
          <p className="text-xs text-graphite-soft/65">
            {list.length} דגמים שהיצרן פרסם עבורם צריכה שנתית, מהחסכוני ביותר.
          </p>
        </div>

        {list.length === 0 ? (
          <p className="mt-4 text-sm text-graphite-soft/80">אין כרגע דגמים עם נתון צריכה פורסם. בטלו את סינון המלאי או שאלו אותנו.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-graphite-soft/70">
                  <th scope="col" className="py-2 pe-3 font-semibold">דגם</th>
                  <th scope="col" className="py-2 pe-3 font-semibold">קוט״ש בשנה</th>
                  <th scope="col" className="py-2 pe-3 font-semibold">עלות בשנה</th>
                  <th scope="col" className="py-2 font-semibold">חיסכון מול הנוכחי</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => {
                  const saving = valid ? (old - m.annualKwh) * rate : null;
                  return (
                    <tr key={m.slug} className="border-b border-line/60 last:border-0">
                      <td className="py-2.5 pe-3">
                        <Link href={`/products/${m.slug}`} className="font-semibold text-graphite hover:text-brand-blue hover:underline">
                          {m.name}
                        </Link>
                        <span className="block text-xs text-graphite-soft/60">
                          {[m.brand, m.modelNumber].filter(Boolean).join(" · ")}
                          {m.inStock ? "" : " · לא במלאי כרגע"}
                        </span>
                      </td>
                      <td className="py-2.5 pe-3 tabular-nums">{fmt(m.annualKwh, 0)}</td>
                      <td className="py-2.5 pe-3 tabular-nums">{valid ? ils(m.annualKwh * rate) : "—"}</td>
                      <td className={cx("py-2.5 tabular-nums font-semibold", saving !== null && saving > 0 ? "text-success" : "text-graphite-soft/60")}>
                        {saving === null ? "—" : saving > 0 ? `${ils(saving)} בשנה` : "צורך יותר"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line/70 pt-4">
          <WhatsAppButton
            message={`שלום, המקרר שלי צורך כ־${oldKwh} קוט״ש בשנה. איזה מקרר חסכוני מתאים לי?`}
            label="להתייעץ על מקרר בוואטסאפ"
            trackAs="whatsapp_click_product"
          />
          <Link href={`/categories/${scope}`} className="text-sm font-semibold text-brand-blue hover:underline">
            {scope === "freezers" ? "לכל המקפיאים בקטלוג ←" : "לכל המקררים בקטלוג ←"}
          </Link>
        </div>
      </section>
    </div>
  );
}
