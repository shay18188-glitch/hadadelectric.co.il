"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AcCandidate } from "@/lib/energy/catalogEnergy";
import { NumberField, ResultPanel, ToggleChips, parseNum } from "@/components/energy/CalcFields";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BTU_PER_HP, TARIFF_AGOROT_INC_VAT, acElectricKw, fmt, ils, recommendedBtu } from "@/lib/energy/tariff";
import { cx } from "@/lib/utils";

/**
 * Two questions people ask about an air conditioner, answered together: what
 * size the room needs, and what that size costs to run.
 *
 * The size comes from the rule of thumb the Israeli market quotes (650 BTU per
 * square metre plus 500 per occupant), and the running cost from the cooling
 * output, an efficiency figure and an average load. Then the answer is turned
 * into models: every unit in the catalog whose published cooling output falls
 * near the recommendation, each costed at its own BTU, so the reader leaves
 * with a shortlist rather than a number.
 */

type Mode = "room" | "size";

/**
 * A unit within this band of the recommendation is offered as a match. The
 * lower bound is where kamayotze's calculator starts warning "too small".
 */
const BAND = { below: 0.85, above: 1.35 };

export function AcCostCalculator({ candidates }: { candidates: AcCandidate[] }) {
  const [mode, setMode] = useState<Mode>("room");
  const [area, setArea] = useState("16");
  const [people, setPeople] = useState("2");
  const [hp, setHp] = useState("1.5");
  const [hours, setHours] = useState("8");
  const [days, setDays] = useState("30");
  const [cop, setCop] = useState("3.5");
  const [load, setLoad] = useState("70");
  const [tariff, setTariff] = useState(String(TARIFF_AGOROT_INC_VAT));
  const [inStockOnly, setInStockOnly] = useState(true);

  const a = parseNum(area);
  const pe = parseNum(people) ?? 0;
  const hpN = parseNum(hp);
  const h = parseNum(hours);
  const d = parseNum(days);
  const c = parseNum(cop);
  const l = parseNum(load);
  const t = parseNum(tariff);

  const needBtu =
    mode === "room" ? (a !== null && a > 0 ? recommendedBtu(a, pe) : null) : hpN !== null && hpN > 0 ? hpN * BTU_PER_HP : null;
  const runValid = h !== null && h >= 0 && h <= 24 && d !== null && d >= 0 && c !== null && c > 0 && l !== null && l > 0 && l <= 100 && t !== null && t > 0;

  const monthlyCost = (btu: number) =>
    runValid ? acElectricKw(btu, c) * (l / 100) * h * d * (t / 100) : null;

  const matches = useMemo(() => {
    if (needBtu === null) return [];
    const pool = candidates.filter((m) => (inStockOnly ? m.inStock : true));
    const inBand = pool.filter((m) => m.btu >= needBtu * BAND.below && m.btu <= needBtu * BAND.above);
    // Nothing in the band — say the room needs 30,000 BTU and the largest unit
    // is 28,000 — still show the nearest models rather than an empty list.
    const list = inBand.length > 0 ? inBand : [...pool].sort((x, y) => Math.abs(x.btu - needBtu) - Math.abs(y.btu - needBtu)).slice(0, 4);
    return list.sort((x, y) => Number(y.inverter) - Number(x.inverter) || x.btu - y.btu);
  }, [candidates, inStockOnly, needBtu]);
  const exactBand = needBtu !== null && matches.some((m) => m.btu >= needBtu * BAND.below && m.btu <= needBtu * BAND.above);

  let result: { primary: string; rows: { label: string; value: string }[]; notes: string[] } | null = null;
  if (needBtu !== null && runValid) {
    const kw = acElectricKw(needBtu, c) * (l / 100);
    result = {
      primary: ils(kw * h * d * (t / 100)),
      rows: [
        ...(mode === "room"
          ? [{ label: "גודל מזגן מומלץ לחדר", value: `${fmt(needBtu, 0)} BTU · כ־${fmt(needBtu / BTU_PER_HP, 2)} כ״ס` }]
          : [{ label: "תפוקת קירור", value: `${fmt(needBtu, 0)} BTU` }]),
        { label: "עלות לשעה", value: ils(kw * (t / 100)) },
        { label: `עלות ליום (${h === 1 ? "שעה" : `${fmt(h, 1)} שעות`})`, value: ils(kw * h * (t / 100)) },
        { label: "צריכה בתקופה", value: `${fmt(kw * h * d, 1)} קוט״ש` },
        { label: "עונת קיץ (120 ימים)", value: ils(kw * h * 120 * (t / 100)) },
      ],
      notes: [
        "גודל החדר מחושב לפי כלל אצבע מקובל: 650 BTU למ״ר ועוד 500 לכל אדם. חדר בקומה עליונה, עם חלונות גדולים לדרום או מטבח פתוח צריך יותר.",
        `העלות מניחה מקדם יעילות (COP) של ${fmt(c)} ועומס ממוצע של ${fmt(l, 0)}% — מזגן אינוורטר בטמפרטורה מתונה עובד רוב הזמן מתחת להספק המלא.`,
      ],
    };
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="surface-card rounded-[1.5rem] p-5 md:p-6">
          <ToggleChips<Mode>
            label="מה ידוע לכם?"
            value={mode}
            onChange={setMode}
            options={[
              { value: "room", label: "גודל החדר" },
              { value: "size", label: "גודל המזגן (כ״ס)" },
            ]}
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {mode === "room" ? (
              <>
                <NumberField id="ac-area" label="שטח החדר" unit="מ״ר" value={area} onChange={setArea} min={1} />
                <NumberField id="ac-people" label="אנשים בחדר בדרך כלל" value={people} onChange={setPeople} step={1} />
              </>
            ) : (
              <NumberField id="ac-hp" label="גודל המזגן" unit="כ״ס" value={hp} onChange={setHp} min={0.5} step={0.25} help="1 כ״ס ≈ 9,000 BTU (מוסכמת השוק בישראל)." />
            )}
            <NumberField id="ac-hours" label="שעות הפעלה ביום" unit="שעות" value={hours} onChange={setHours} />
            <NumberField id="ac-days" label="ימים בתקופה" unit="ימים" value={days} onChange={setDays} help="חודש — 30, עונת קיץ בצפון — כ־120." />
            <NumberField id="ac-cop" label="מקדם יעילות (COP)" value={cop} onChange={setCop} min={1} step={0.1} help="אינוורטר חדש: 3.5–4.5. מזגן ON/OFF ישן: 2.5–3. מופיע במפרט כ־COP או EER." />
            <NumberField id="ac-load" label="עומס ממוצע" unit="%" value={load} onChange={setLoad} min={1} help="100% = הספק מלא כל הזמן. אינוורטר בשימוש רגיל: 50%–70%." />
            <NumberField id="ac-tariff" label="תעריף כולל מע״מ" unit="אג׳/קוט״ש" value={tariff} onChange={setTariff} />
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          <ResultPanel
            primaryLabel={`עלות הפעלה ל־${d !== null ? fmt(d, 0) : "?"} ימים`}
            primaryValue={result?.primary ?? null}
            rows={result?.rows}
            notes={result?.notes}
            empty={mode === "room" ? "הזינו את שטח החדר כדי לקבל גודל מזגן ועלות הפעלה." : "הזינו את גודל המזגן בכ״ס."}
          />
        </div>
      </div>

      {needBtu !== null && (
        <section className="surface-card rounded-[1.5rem] p-5 md:p-6" aria-labelledby="ac-matches-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="ac-matches-heading" className="text-lg font-black text-graphite md:text-xl">
              {exactBand ? `מזגנים בקטלוג שמתאימים ל־${fmt(needBtu, 0)} BTU` : "הדגמים הקרובים ביותר בקטלוג"}
            </h2>
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
          </div>
          {matches.length === 0 ? (
            <div className="mt-3">
              <p className="text-sm leading-relaxed text-graphite-soft/80">
                אין כרגע דגם במלאי בגודל הזה. בטלו את סינון המלאי, או שלחו לנו את מידות החדר ונמליץ על דגם.
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid gap-2.5 md:grid-cols-2">
              {matches.map((m) => {
                const cost = monthlyCost(m.btu);
                return (
                  <li key={m.slug}>
                    <Link
                      href={`/products/${m.slug}`}
                      className="block h-full rounded-2xl border border-line bg-white p-3.5 transition-colors hover:border-brand-blue/40"
                    >
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="flex-1 text-sm font-semibold text-graphite">
                          {m.name} {m.brand ? `· ${m.brand}` : ""}
                        </span>
                        {m.inverter && (
                          <span className="rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-semibold text-success">אינוורטר</span>
                        )}
                        {m.portable && (
                          <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-graphite-soft">נייד</span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs text-graphite-soft/65" dir="rtl">
                        {m.modelNumber} · {fmt(m.btu, 0)} BTU{m.inStock ? "" : " · לא במלאי כרגע"}
                      </span>
                      {cost !== null && (
                        <span className="mt-1.5 block text-xs font-semibold text-brand-blue">
                          כ־{ils(cost)} ל־{fmt(d ?? 0, 0)} ימים בהנחות שלמעלה
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line/70 pt-4">
            <WhatsAppButton
              message={`שלום, יש לי חדר של ${a ?? "?"} מ״ר${mode === "room" ? "" : ` ומזגן של ${hp} כ״ס`}. איזה מזגן אתם ממליצים?`}
              label="להתייעץ על מזגן בוואטסאפ"
              trackAs="whatsapp_click_product"
            />
            <Link href="/categories/air-conditioners" className="text-sm font-semibold text-brand-blue hover:underline">
              לכל המזגנים בקטלוג ←
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
