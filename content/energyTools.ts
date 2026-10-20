import type { KamaYotzeLinkKey } from "@/lib/energy/tariff";

/**
 * The calculators under /tools, in the order the hub lists them.
 *
 * Each entry names the guide that explains the same question in prose and the
 * kamayotze.co.il calculator that answers its general-purpose version, so
 * every tool page links three ways: to the catalog, to the article, and out.
 */

export interface EnergyTool {
  path: string;
  title: string;
  short: string;
  kicker: string;
  kamayotze: KamaYotzeLinkKey[];
  guideSlugs: string[];
}

export const ENERGY_TOOLS: EnergyTool[] = [
  {
    path: "/tools/air-conditioner-cost",
    title: "מחשבון מזגן — גודל לחדר ועלות הפעלה",
    short: "כמה כ״ס צריך לחדר, כמה זה עולה בחודש, ואילו מזגנים מהקטלוג מתאימים.",
    kicker: "מזגנים",
    kamayotze: ["ac", "bill"],
    guideSlugs: ["air-conditioner-size-for-room", "air-conditioner-running-cost", "air-conditioner-buying-guide"],
  },
  {
    path: "/tools/refrigerator-electricity",
    title: "מחשבון צריכת חשמל של מקרר",
    short: "כמה עולה המקרר הנוכחי בשנה, וכמה תחסכו בכל דגם מהקטלוג לפי הצריכה שבתווית.",
    kicker: "מקררים",
    kamayotze: ["appliance", "bill"],
    guideSlugs: ["refrigerator-electricity-consumption", "energy-rating-savings", "how-to-choose-a-refrigerator"],
  },
  {
    path: "/tools/electricity-cost",
    title: "מחשבון צריכת חשמל של מוצרי חשמל",
    short: "וואט × שעות = קוט״ש: עלות לשעה, לחודש ולשנה של מקרר, מייבש, תנור, פלטה ועוד.",
    kicker: "כל המכשירים",
    kamayotze: ["appliance", "bill"],
    guideSlugs: ["appliance-electricity-consumption-table", "electricity-price-per-kwh-2026", "energy-rating-savings"],
  },
  {
    path: "/tools/water-heater-timer",
    title: "כמה זמן להדליק דוד",
    short: "זמן הדלקה לטיימר ועלות החימום לפי נפח הדוד, העונה ומספר המקלחות.",
    kicker: "דוד חשמל",
    kamayotze: ["waterHeater"],
    guideSlugs: ["water-heater-how-long", "electricity-price-per-kwh-2026"],
  },
  {
    path: "/tools/amps-to-watts",
    title: "המרת וואט לאמפר — האם המכשיר מתאים לשקע",
    short: "כמה אמפר מושך מכשיר, האם שקע רגיל של 16 אמפר יעמוד בו, ומה עלות השעה.",
    kicker: "חשמל בבית",
    kamayotze: ["amps", "bill"],
    guideSlugs: ["appliance-electricity-consumption-table", "built-in-oven-buying-guide"],
  },
];

export function energyToolByPath(path: string): EnergyTool | null {
  return ENERGY_TOOLS.find((tool) => tool.path === path) ?? null;
}

/**
 * Which calculator a category page points to, with the question as the
 * category's buyer would ask it. Categories absent here carry no tool link.
 */
const CATEGORY_TOOLS: Record<string, { path: string; prompt: string }> = {
  "air-conditioners": { path: "/tools/air-conditioner-cost", prompt: "כמה כ״ס צריך לחדר, וכמה זה יעלה בחשמל?" },
  "air-coolers": { path: "/tools/air-conditioner-cost", prompt: "מזגן או מצנן? בדקו כמה כ״ס צריך לחדר וכמה זה עולה." },
  refrigerators: { path: "/tools/refrigerator-electricity", prompt: "כמה עולה המקרר הנוכחי בשנה, וכמה תחסכו בכל דגם?" },
  freezers: { path: "/tools/refrigerator-electricity", prompt: "כמה עולה להפעיל מקפיא, לפי הצריכה שבתווית?" },
  ovens: { path: "/tools/amps-to-watts", prompt: "התנור יעמוד בשקע הקיים? בדקו כמה אמפר הוא מושך." },
  cooktops: { path: "/tools/amps-to-watts", prompt: "כמה אמפר מושכות כיריים חשמליות, והאם צריך מעגל ייעודי?" },
  dryers: { path: "/tools/electricity-cost", prompt: "כמה עולה מחזור ייבוש, ובכמה זה מצטבר בשנה?" },
  "washing-machines": { path: "/tools/electricity-cost", prompt: "כמה חשמל צורכת מכונת כביסה בחודש?" },
  dishwashers: { path: "/tools/electricity-cost", prompt: "כמה עולה להפעיל מדיח כלים כל יום?" },
  heaters: { path: "/tools/electricity-cost", prompt: "כמה עולה שעה של תנור חימום — ומה זה בחודש של חורף?" },
  "space-heaters": { path: "/tools/electricity-cost", prompt: "כמה עולה שעה של מפזר חום?" },
  "shabbat-hot-plates": { path: "/tools/electricity-cost", prompt: "כמה עולה פלטת שבת לשבת ולחודש?" },
  tvs: { path: "/tools/electricity-cost", prompt: "כמה חשמל צורכת טלוויזיה בחודש?" },
  fans: { path: "/tools/electricity-cost", prompt: "כמה עולה מאוורר שדולק כל הלילה?" },
  "air-fryers": { path: "/tools/electricity-cost", prompt: "כמה עולה להפעיל סיר טיגון ללא שמן?" },
  kettles: { path: "/tools/electricity-cost", prompt: "כמה עולה להרתיח קומקום?" },
};

export function toolForCategory(categorySlug: string): { tool: EnergyTool; prompt: string } | null {
  const entry = CATEGORY_TOOLS[categorySlug];
  const tool = entry ? energyToolByPath(entry.path) : null;
  return entry && tool ? { tool, prompt: entry.prompt } : null;
}
