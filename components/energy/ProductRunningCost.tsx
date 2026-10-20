import Link from "next/link";
import { acCandidate, fridgeCandidate } from "@/lib/energy/catalogEnergy";
import { BTU_PER_M2, BTU_PER_PERSON, TARIFF_AGOROT_INC_VAT, TARIFF_ILS, acElectricKw, fmt, ils } from "@/lib/energy/tariff";
import type { Product } from "@/types/product";

/**
 * The running cost of this model, in shekels, on its own product page.
 *
 * Only for the two categories where the sheet carries a number that supports
 * it — cooling BTU on an air conditioner, label kWh on a refrigerator — and
 * only when that number parses. Everything else renders nothing. The
 * assumptions are printed beside the figure, and the link hands the reader to
 * the calculator to replace them with their own.
 */

const AC_ASSUMED = { cop: 3.5, load: 0.7, hours: 8, days: 30 };

export function ProductRunningCost({ product }: { product: Product }) {
  const ac = acCandidate(product);
  const fridge = ac ? null : fridgeCandidate(product);
  if (!ac && !fridge) return null;

  let title: string;
  let figure: string;
  let rows: { label: string; value: string }[];
  let assumption: string;
  let href: string;

  if (ac) {
    const kw = acElectricKw(ac.btu, AC_ASSUMED.cop);
    const monthly = kw * AC_ASSUMED.load * AC_ASSUMED.hours * AC_ASSUMED.days * TARIFF_ILS;
    // The room this unit suits, inverting the 650-per-m² rule for two occupants.
    const roomM2 = Math.max(0, (ac.btu - 2 * BTU_PER_PERSON) / BTU_PER_M2);
    title = "כמה יעלה להפעיל את המזגן הזה?";
    figure = `כ־${ils(monthly)} בחודש`;
    rows = [
      { label: "תפוקת קירור (מהמפרט)", value: `${fmt(ac.btu, 0)} BTU` },
      { label: "שעה בהספק מלא", value: ils(kw * TARIFF_ILS) },
      { label: "עונת קיץ (120 ימים)", value: ils(kw * AC_ASSUMED.load * AC_ASSUMED.hours * 120 * TARIFF_ILS) },
      { label: "מתאים לחדר של עד כ־", value: `${fmt(roomM2, 0)} מ״ר (2 אנשים)` },
    ];
    assumption = `בהנחת 8 שעות ביום, עומס ממוצע של 70% ומקדם יעילות 3.5. אם ה־COP במפרט גבוה יותר — העלות נמוכה יותר.`;
    href = "/tools/air-conditioner-cost";
  } else {
    const kwh = fridge!.annualKwh;
    title = "כמה עולה להפעיל אותו?";
    figure = `כ־${ils((kwh / 12) * TARIFF_ILS)} בחודש`;
    rows = [
      { label: "צריכה שנתית (מהמפרט)", value: `${fmt(kwh, 0)} קוט״ש` },
      { label: "בשנה", value: ils(kwh * TARIFF_ILS) },
      { label: "ב־12 שנה", value: ils(kwh * TARIFF_ILS * 12) },
    ];
    assumption = "לפי הצריכה השנתית שהיצרן פרסם. הצריכה בפועל משתנה עם הטמפרטורה במטבח והרגלי השימוש.";
    href = "/tools/refrigerator-electricity";
  }

  return (
    <section className="mt-10 rounded-[1.5rem] border border-brand-blue/20 bg-white p-5 md:mt-12 md:p-6" aria-labelledby="running-cost-heading">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
        <div>
          <p className="text-xs font-bold text-brand-blue">עלות חשמל משוערת</p>
          <h2 id="running-cost-heading" className="mt-1 text-lg font-black text-graphite md:text-xl">
            {title}
          </h2>
          <p className="mt-2 text-3xl font-black tabular-nums tracking-[-0.03em] text-brand-blue">{figure}</p>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-graphite-soft/70">
            {assumption} תעריף: {TARIFF_AGOROT_INC_VAT} אג׳ לקוט״ש כולל מע״מ.
          </p>
        </div>
        <dl className="min-w-0 divide-y divide-line/70 text-sm md:w-80 md:shrink-0">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-graphite-soft/80">{row.label}</dt>
              <dd className="shrink-0 font-semibold tabular-nums text-graphite">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-3 border-t border-line/70 pt-3 text-sm">
        <Link href={href} className="font-semibold text-brand-blue hover:underline">
          {ac ? "לחשב לפי החדר והשעות שלכם, ולהשוות לדגמים אחרים ←" : "להשוות מול המקרר שיש לכם היום ←"}
        </Link>
      </p>
    </section>
  );
}
