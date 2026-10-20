"use client";

import { useState } from "react";
import { NumberField, ResultPanel, SelectField, ToggleChips, parseNum } from "@/components/energy/CalcFields";
import { TARIFF_AGOROT_INC_VAT, fmt, ils } from "@/lib/energy/tariff";

/**
 * How long to switch the boiler on, and what it costs.
 *
 * Plain physics — 4.186 kJ to raise a litre by a degree — with a 5% loss
 * allowance and the inlet temperature by season. The same model kamayotze's
 * water-heater calculator uses, so the two sites give the same timer.
 */

const KJ_PER_L_C = 4.186;
const EFFICIENCY = 0.95;
const SHOWER_TEMP = 40;
const SEASON_COLD: Record<string, number> = { winter: 15, spring: 20, summer: 25 };

function heatKwh(liters: number, cold: number, target: number): number {
  return (liters * KJ_PER_L_C * Math.max(0, target - cold)) / 3600 / EFFICIENCY;
}

function duration(hours: number): string {
  const total = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} דקות`;
  if (m === 0) return h === 1 ? "שעה" : `${h} שעות`;
  return `${h === 1 ? "שעה" : `${h} שעות`} ו־${m} דקות`;
}

type Mode = "showers" | "full";

export function WaterHeaterCalculator() {
  const [volume, setVolume] = useState("150");
  const [kw, setKw] = useState("2.5");
  const [season, setSeason] = useState("winter");
  const [target, setTarget] = useState("55");
  const [mode, setMode] = useState<Mode>("showers");
  const [showers, setShowers] = useState("3");
  const [litersPerShower, setLitersPerShower] = useState("40");
  const [days, setDays] = useState("30");
  const [tariff, setTariff] = useState(String(TARIFF_AGOROT_INC_VAT));

  const v = parseNum(volume);
  const k = parseNum(kw);
  const tg = parseNum(target);
  const sh = parseNum(showers);
  const lps = parseNum(litersPerShower);
  const d = parseNum(days);
  const t = parseNum(tariff);
  const cold = SEASON_COLD[season] ?? 15;

  let result: { primary: string; rows: { label: string; value: string }[]; notes: string[] } | null = null;
  const valid =
    v !== null && v > 0 && k !== null && k > 0 && tg !== null && tg > cold && d !== null && d >= 0 && t !== null && t > 0 &&
    (mode === "full" || (sh !== null && sh > 0 && lps !== null && lps > 0));

  if (valid) {
    const hotPerShower = (liters: number) => (liters * (SHOWER_TEMP - cold)) / (tg - cold);
    const need = mode === "showers" ? (sh ?? 0) * hotPerShower(lps ?? 0) : v;
    const liters = Math.min(v, need);
    const kwh = heatKwh(liters, cold, tg);
    const timer = Math.ceil(((kwh / k) * 60 - 1e-9) / 5) * 5;
    const cost = kwh * (t / 100);
    const notes = [`חושב עם מים נכנסים ב־${cold} מעלות ו־5% הפסדי חום. אם דוד השמש חימם חלקית — הזמן קצר יותר.`];
    if (mode === "showers" && need > v) notes.push(`המקלחות דורשות כ־${fmt(need, 0)} ליטר מים חמים, יותר מנפח הדוד — חושב חימום של כל הדוד.`);
    if (mode === "showers" && need <= v) notes.push(`צריך לחמם כ־${fmt(need, 0)} ליטר (${fmt((need / v) * 100, 0)}% מהדוד). המים החמים מצטברים בחלק העליון, ולכן לא צריך לחמם את כל הדוד.`);
    result = {
      primary: duration(timer / 60),
      rows: [
        { label: "עלות לחימום", value: ils(cost) },
        { label: "אנרגיה לחימום", value: `${fmt(kwh, 2)} קוט״ש` },
        { label: "עלות שעת הפעלה של הגוף", value: ils(k * (t / 100)) },
        { label: `עלות בחודש (${fmt(d, 0)} הדלקות)`, value: ils(cost * d) },
        { label: "מקלחות של 40 ליטר מהחימום הזה", value: fmt(Math.floor((liters / hotPerShower(40)) * 10) / 10, 1) },
      ],
      notes,
    };
  }

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="surface-card rounded-[1.5rem] p-5 md:p-6">
        <ToggleChips<Mode>
          label="מה רוצים לחמם?"
          value={mode}
          onChange={setMode}
          options={[
            { value: "showers", label: "לפי מספר מקלחות" },
            { value: "full", label: "את כל הדוד" },
          ]}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectField
            id="boiler-volume"
            label="נפח הדוד"
            value={volume}
            onChange={setVolume}
            options={["60", "80", "100", "120", "150", "200"].map((l) => ({ value: l, label: `${l} ליטר` }))}
          />
          <NumberField id="boiler-kw" label="הספק גוף החימום" unit="קילוואט" value={kw} onChange={setKw} min={0.5} step={0.1} help="ברוב הדודים הביתיים 2.5 קילוואט — כתוב במדבקה." />
          <SelectField
            id="boiler-season"
            label="עונה"
            value={season}
            onChange={setSeason}
            options={[
              { value: "winter", label: "חורף (מים נכנסים ב־15°)" },
              { value: "spring", label: "אביב / סתיו (20°)" },
              { value: "summer", label: "קיץ (25°)" },
            ]}
          />
          <NumberField id="boiler-target" label="טמפרטורת יעד" unit="°C" value={target} onChange={setTarget} min={41} step={1} help="לפי התרמוסטט, בדרך כלל 55–60." />
          {mode === "showers" && (
            <>
              <NumberField id="boiler-showers" label="מספר מקלחות" value={showers} onChange={setShowers} min={1} step={1} />
              <NumberField id="boiler-lps" label="ליטרים למקלחת (ב־40°)" unit="ליטר" value={litersPerShower} onChange={setLitersPerShower} min={1} help="מקלחת של כ־5 דקות: 40–50 ליטר." />
            </>
          )}
          <NumberField id="boiler-days" label="הדלקות בחודש" value={days} onChange={setDays} step={1} />
          <NumberField id="boiler-tariff" label="תעריף כולל מע״מ" unit="אג׳/קוט״ש" value={tariff} onChange={setTariff} />
        </div>
      </div>
      <div className="lg:sticky lg:top-24">
        <ResultPanel
          primaryLabel="זמן הדלקה מומלץ (לטיימר)"
          primaryValue={result?.primary ?? null}
          rows={result?.rows}
          notes={result?.notes}
          empty="בדקו את הערכים — טמפרטורת היעד צריכה להיות גבוהה מטמפרטורת המים הנכנסים."
        />
      </div>
    </div>
  );
}
