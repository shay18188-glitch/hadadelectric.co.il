"use client";

import { useState } from "react";
import { NumberField, ResultPanel, ToggleChips, parseNum } from "@/components/energy/CalcFields";
import { TARIFF_AGOROT_INC_VAT, fmt, ils } from "@/lib/energy/tariff";

/**
 * Amps ↔ watts for a single-phase home circuit, and whether it fits a socket.
 *
 * The question behind it is usually practical — can the new oven, dryer or
 * air conditioner go on the existing socket — so the answer leads with the
 * 16 A breaker a standard Israeli socket sits on. Three-phase and power-factor
 * detail live in kamayotze's fuller calculator, linked from the page.
 */

const VOLTS = 230;
const SOCKET_AMPS = 16;

type Mode = "w2a" | "a2w";

export function AmpsWattsCalculator() {
  const [mode, setMode] = useState<Mode>("w2a");
  const [watts, setWatts] = useState("3000");
  const [amps, setAmps] = useState("10");
  const [hours, setHours] = useState("1");
  const [tariff, setTariff] = useState(String(TARIFF_AGOROT_INC_VAT));

  const w0 = parseNum(watts);
  const a0 = parseNum(amps);
  const h = parseNum(hours);
  const t = parseNum(tariff);

  const w = mode === "w2a" ? w0 : a0 !== null ? a0 * VOLTS : null;
  const a = mode === "a2w" ? a0 : w0 !== null ? w0 / VOLTS : null;

  let result: { primary: string; rows: { label: string; value: string }[]; notes: string[] } | null = null;
  if (w !== null && w > 0 && a !== null && a > 0 && h !== null && h >= 0 && h <= 24 && t !== null && t > 0) {
    const kw = w / 1000;
    result = {
      primary: mode === "w2a" ? `${fmt(a, 1)} אמפר` : `${fmt(w, 0)} וואט`,
      rows: [
        mode === "w2a" ? { label: "הספק", value: `${fmt(w, 0)} וואט` } : { label: "זרם", value: `${fmt(a, 1)} אמפר` },
        { label: "עלות שעת הפעלה", value: ils(kw * (t / 100)) },
        { label: `עלות בחודש (${h === 1 ? "שעה" : `${fmt(h, 1)} שעות`} ביום)`, value: ils(kw * h * 30 * (t / 100)) },
        { label: "ניצול שקע של 16 אמפר", value: `${fmt((a / SOCKET_AMPS) * 100, 0)}%` },
      ],
      notes: [
        a <= SOCKET_AMPS * 0.8
          ? `${fmt(a, 1)} אמפר — בטווח של שקע ביתי רגיל (מפסק 16 אמפר, עד כ־3,680 וואט), בתנאי שאין על אותו מעגל עוד מכשיר כבד.`
          : a <= SOCKET_AMPS
            ? `${fmt(a, 1)} אמפר — קרוב לגבול של שקע רגיל. מכשיר כזה עדיף על מעגל משלו, בלי מפצל ובלי מכשירים נוספים על אותו קו.`
            : `${fmt(a, 1)} אמפר — יותר ממה ששקע רגיל של 16 אמפר מספק. נדרש מעגל ייעודי — התייעצו עם חשמלאי מוסמך לפני ההתקנה.`,
        "חושב לפי 230 וולט חד־פאזי ומקדם הספק 1. מנועים ומדחסים מושכים זרם גבוה יותר לרגע ההתנעה.",
      ],
    };
  }

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="surface-card rounded-[1.5rem] p-5 md:p-6">
        <ToggleChips<Mode>
          label="מה ידוע לכם?"
          value={mode}
          onChange={setMode}
          options={[
            { value: "w2a", label: "וואט ← אמפר" },
            { value: "a2w", label: "אמפר ← וואט" },
          ]}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {mode === "w2a" ? (
            <NumberField id="aw-watts" label="הספק המכשיר" unit="וואט" value={watts} onChange={setWatts} min={1} help="כתוב במדבקה או במפרט (W). תנור בנוי: 2,500–3,600. מייבש: 2,000–3,000." />
          ) : (
            <NumberField id="aw-amps" label="זרם" unit="אמפר" value={amps} onChange={setAmps} min={0.1} help="כתוב במדבקה (A) או על המפסק." />
          )}
          <NumberField id="aw-hours" label="שעות הפעלה ביום" unit="שעות" value={hours} onChange={setHours} />
          <NumberField id="aw-tariff" label="תעריף כולל מע״מ" unit="אג׳/קוט״ש" value={tariff} onChange={setTariff} />
        </div>
      </div>
      <div className="lg:sticky lg:top-24">
        <ResultPanel primaryLabel={mode === "w2a" ? "זרם" : "הספק"} primaryValue={result?.primary ?? null} rows={result?.rows} notes={result?.notes} />
      </div>
    </div>
  );
}
