/**
 * The electricity numbers every calculator on the site multiplies by.
 *
 * Kept in one file, and identical to the figures kamayotze.co.il publishes,
 * because the two sites link to each other: a reader who runs the same fridge
 * through both and gets two different shekel amounts trusts neither. The
 * Electricity Authority revises the residential tariff on 1 January and
 * 1 July; when it does, this file and kama-yotze's `params/electricity-2026.ts`
 * change together.
 */

/** Residential flat tariff from 1.7.2026, agorot per kWh including 18% VAT (53.83 before VAT). */
export const TARIFF_AGOROT_INC_VAT = 63.52;
export const TARIFF_AGOROT_EX_VAT = 53.83;
/** ₪ per kWh, including VAT — what the calculators multiply by. */
export const TARIFF_ILS = TARIFF_AGOROT_INC_VAT / 100;
export const TARIFF_FROM_HE = "1.7.2026";
export const TARIFF_NEXT_UPDATE_HE = "1.1.2027";
export const TARIFF_SOURCE_URL = "https://www.gov.il/he/pages/idkun_medadim";

/** Representative household (Electricity Authority, 07/2026 update): 8,000 kWh a year. */
export const REPRESENTATIVE_ANNUAL_KWH = 8000;

/** Air-conditioning rules of thumb the Israeli market sizes by (Electra / Tadiran). */
export const BTU_PER_HP = 9000;
export const W_PER_BTU = 0.29307107;
export const BTU_PER_M2 = 650;
export const BTU_PER_PERSON = 500;

/**
 * The matching calculators on kamayotze.co.il.
 *
 * Each of our tools answers the question in the shop's terms — which model,
 * from the shelf — and hands the reader to the general-purpose calculator for
 * the parts we deliberately leave out (the bill's fixed charges, three-phase
 * detail, a private supplier's discount). Plain followed links, on purpose.
 */
export const KAMAYOTZE = {
  home: { href: "https://kamayotze.co.il/", label: "כמה יוצא — מחשבונים לכסף, שכר וזכויות" },
  carHome: { href: "https://kamayotze.co.il/car-home", label: "מחשבוני רכב, בית ואנרגיה" },
  appliance: {
    href: "https://kamayotze.co.il/car-home/appliance-electricity",
    label: "מחשבון צריכת חשמל של מכשיר",
    description: "וואט × שעות = קוט״ש, עם מקדם פעולה למכשירים עם תרמוסטט ותעריף של ספק פרטי.",
  },
  bill: {
    href: "https://kamayotze.co.il/car-home/electricity-bill",
    label: "מחשבון חשבון חשמל",
    description: "הערכת החשבון הדו־חודשי כולל תשלום קבוע, רכיב קיבולת לפי גודל החיבור ומע״מ.",
  },
  amps: {
    href: "https://kamayotze.co.il/car-home/amps-to-watts",
    label: "צריכת חשמל לפי אמפר",
    description: "אמפר לוואט ולהפך בחד־פאזי ובתלת־פאזי, כולל מקדם הספק.",
  },
  ac: {
    href: "https://kamayotze.co.il/car-home/ac-electricity",
    label: "כמה עולה להפעיל מזגן",
    description: "עלות לפי כ״ס, BTU או וואט, עם מקדם יעילות ועומס ממוצע.",
  },
  waterHeater: {
    href: "https://kamayotze.co.il/car-home/water-heater",
    label: "כמה זמן להדליק דוד",
    description: "זמן הדלקה ועלות לפי נפח, עונה ומספר מקלחות.",
  },
  evCost: {
    href: "https://kamayotze.co.il/car-home/ev-charging-cost",
    label: "עלות טעינת רכב חשמלי",
    description: "טעינה בבית, במסלול לילה ובעמדה ציבורית, ועלות ל־100 ק״מ.",
  },
  evTime: {
    href: "https://kamayotze.co.il/car-home/ev-charging-time",
    label: "זמן טעינת רכב חשמלי",
    description: "לפי גודל הסוללה וסוג המטען — שקע רגיל, עמדה ביתית או DC.",
  },
  evVsGas: {
    href: "https://kamayotze.co.il/car-home/ev-vs-gas",
    label: "רכב חשמלי או בנזין",
    description: "עלות לק״מ ולשנה, וכמה שנים עד החזר פער המחיר.",
  },
} as const;

export type KamaYotzeLinkKey = Exclude<keyof typeof KAMAYOTZE, "home" | "carHome">;

/** Hebrew number formatting shared by the calculators. */
export function fmt(value: number, digits = 2): string {
  return value.toLocaleString("he-IL", { maximumFractionDigits: digits });
}

export function ils(value: number): string {
  return `${value.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪`;
}

/** Air-conditioner size a room needs, by the area-and-occupants rule of thumb. */
export function recommendedBtu(areaM2: number, people: number): number {
  return areaM2 * BTU_PER_M2 + Math.max(0, people) * BTU_PER_PERSON;
}

/** Electrical draw, in kW, of an air conditioner delivering `btu` at efficiency `cop`. */
export function acElectricKw(btu: number, cop: number): number {
  return (btu * W_PER_BTU) / 1000 / cop;
}
