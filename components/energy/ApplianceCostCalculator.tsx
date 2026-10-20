"use client";

import { useState } from "react";
import Link from "next/link";
import { NumberField, ResultPanel, SelectField, parseNum } from "@/components/energy/CalcFields";
import { APPLIANCE_PRESETS } from "@/lib/energy/appliancePresets";
import { REPRESENTATIVE_ANNUAL_KWH, TARIFF_AGOROT_INC_VAT, TARIFF_FROM_HE, fmt, ils } from "@/lib/energy/tariff";

/**
 * Watts × hours × tariff, with the appliances the shop sells as presets.
 *
 * The preset values are orders of magnitude, not measurements — the real draw
 * differs a lot between models — and the screen says so. What makes the preset
 * worth having is the link it carries: the category on this site where the
 * reader can look up the actual model's label.
 */

export function ApplianceCostCalculator({ initialPreset = "refrigerator" }: { initialPreset?: string }) {
  const start = APPLIANCE_PRESETS[initialPreset] ?? APPLIANCE_PRESETS.refrigerator;
  const [preset, setPreset] = useState(APPLIANCE_PRESETS[initialPreset] ? initialPreset : "refrigerator");
  const [watts, setWatts] = useState(String(start.watts));
  const [hours, setHours] = useState(String(start.hours));
  const [duty, setDuty] = useState(String(start.duty));
  const [days, setDays] = useState(String(start.days));
  const [qty, setQty] = useState("1");
  const [tariff, setTariff] = useState(String(TARIFF_AGOROT_INC_VAT));

  const choose = (key: string) => {
    const p = APPLIANCE_PRESETS[key];
    if (!p) return;
    setPreset(key);
    setWatts(String(p.watts));
    setHours(String(p.hours));
    setDuty(String(p.duty));
    setDays(String(p.days));
  };

  const w = parseNum(watts);
  const h = parseNum(hours);
  const du = parseNum(duty);
  const d = parseNum(days);
  const q = parseNum(qty);
  const t = parseNum(tariff);
  const valid =
    w !== null && w > 0 && h !== null && h >= 0 && h <= 24 && du !== null && du > 0 && du <= 100 &&
    d !== null && d >= 0 && d <= 31 && q !== null && q >= 1 && t !== null && t > 0;

  const current = APPLIANCE_PRESETS[preset];
  let result: { primary: string; rows: { label: string; value: string }[]; notes: string[] } | null = null;
  if (valid) {
    const rate = t / 100;
    const kw = (w / 1000) * (du / 100) * q;
    const kwhDay = kw * h;
    const kwhMonth = kwhDay * d;
    // Daily use runs 365 days, as kamayotze counts it; anything less is the
    // reader's monthly pattern repeated twelve times.
    const kwhYear = d >= 30 ? kwhDay * 365 : kwhMonth * 12;
    result = {
      primary: ils(kwhMonth * rate),
      rows: [
        { label: "עלות שעת הפעלה", value: ils((w / 1000) * q * rate) },
        { label: "צריכה בחודש", value: `${fmt(kwhMonth)} קוט״ש` },
        { label: "צריכה בשנה", value: `${fmt(kwhYear, 0)} קוט״ש` },
        { label: "עלות בשנה", value: ils(kwhYear * rate) },
        {
          label: `חלק מצריכת משק בית ממוצע (${REPRESENTATIVE_ANNUAL_KWH.toLocaleString("he-IL")} קוט״ש בשנה)`,
          value: `${fmt((kwhYear / REPRESENTATIVE_ANNUAL_KWH) * 100, 1)}%`,
        },
      ],
      notes: [
        t === TARIFF_AGOROT_INC_VAT
          ? `לפי התעריף הביתי של רשות החשמל מ־${TARIFF_FROM_HE}: ${TARIFF_AGOROT_INC_VAT} אג׳ לקוט״ש כולל מע״מ.`
          : `לפי תעריף של ${fmt(t)} אג׳ לקוט״ש שהזנתם.`,
        preset !== "custom"
          ? `ההספק והשעות של "${current.label}" הם סדר גודל בלבד. את ההספק המדויק תמצאו במדבקה שעל המכשיר או במפרט שלו בקטלוג.`
          : "רכיב הצריכה בלבד — בלי התשלום הקבוע שבחשבון החשמל.",
      ],
    };
  }

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="surface-card rounded-[1.5rem] p-5 md:p-6">
        <SelectField
          id="appliance-preset"
          label="איזה מכשיר?"
          value={preset}
          onChange={choose}
          options={Object.entries(APPLIANCE_PRESETS).map(([value, p]) => ({ value, label: p.label }))}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberField id="appliance-watts" label="הספק" unit="וואט" value={watts} onChange={setWatts} min={1} help="כתוב במדבקה שעל המכשיר (W). 1 קילוואט = 1,000 וואט." />
          <NumberField id="appliance-hours" label="שעות הפעלה ביום" unit="שעות" value={hours} onChange={setHours} help="12 דקות = 0.2 שעות." />
          <NumberField
            id="appliance-duty"
            label="אחוז מהזמן בהספק מלא"
            unit="%"
            value={duty}
            onChange={setDuty}
            min={1}
            help="מקרר, מקפיא ומזגן עובדים לסירוגין לפי התרמוסטט — כ־40%. מכשיר שעובד ברצף: 100%."
          />
          <NumberField id="appliance-days" label="ימי שימוש בחודש" unit="ימים" value={days} onChange={setDays} />
          <NumberField id="appliance-qty" label="כמות מכשירים" value={qty} onChange={setQty} min={1} step={1} />
          <NumberField
            id="appliance-tariff"
            label="תעריף כולל מע״מ"
            unit="אג׳/קוט״ש"
            value={tariff}
            onChange={setTariff}
            help="ברירת מחדל: התעריף של רשות החשמל. בספק פרטי — הזינו את התעריף אחרי ההנחה."
          />
        </div>
      </div>

      <div className="lg:sticky lg:top-24">
        <ResultPanel
          primaryLabel="עלות בחודש"
          primaryValue={result?.primary ?? null}
          rows={result?.rows}
          notes={result?.notes}
          empty="בדקו את הערכים — שעות ביום עד 24, ימים בחודש עד 31 ואחוז הפעולה בין 1 ל־100."
        >
          {current.categorySlug && (
            <p className="mt-4 border-t border-line/70 pt-3 text-sm">
              <Link href={`/categories/${current.categorySlug}`} className="font-semibold text-brand-blue hover:underline">
                ל{current.categoryLabel} בקטלוג — עם המפרט והדירוג האנרגטי של כל דגם ←
              </Link>
            </p>
          )}
        </ResultPanel>
      </div>
    </div>
  );
}
