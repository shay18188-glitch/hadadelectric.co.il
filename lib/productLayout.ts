import { SPEC_GROUPS, type SpecGroupId } from "@/lib/research/schema";
import { measure } from "@/lib/seo/catalogDimensions";
import type { Product, SpecEntry } from "@/types/product";

/**
 * What a buyer of each kind of product looks at first.
 *
 * A product page used to print every spec row in the order the supplier
 * typed them, so a fridge page opened on "מתח עבודה: 220V" and a kettle page
 * buried its capacity under the cable length. Each family below lists, in
 * order, the facts a person choosing between two models of that kind actually
 * compares. The page shows the first few as tiles beside the photo, sorts the
 * full spec sheet by the same list, and folds the rest into rows the reader
 * opens on demand.
 *
 * Nothing here invents a value: a fact that the record does not carry is
 * simply skipped and the next one on the list takes its place.
 */

/** A spec to look for, by its label. "dims" is the parsed body measurement. */
type KeyToken = RegExp | "dims";

export interface ProductFamily {
  id: string;
  /** Ordered by importance. The first matches become the tiles. */
  keys: KeyToken[];
  /** Research spec groups, most important first. Unlisted groups follow. */
  groups: SpecGroupId[];
  /** Groups shown open by default: where the reader is most likely to need the detail. */
  openGroups: SpecGroupId[];
  /** Built-in and large appliances: installation requirements before marketing bullets. */
  installFirst?: boolean;
}

const ENERGY_CLASS = /דירוג (אנרגטי|יעילות)/;
const NOISE = /(רמת|עוצמת|דירוג) (ה)?רעש|^רעש/;
const COLOR = /^(צבע|גימור)$/;
const WEIGHT = /^משקל/;
const POWER = /^הספק(?! (גריל|שמע|תאורה|מבער))/;
const CAPACITY = /^(נפח|קיבולת)/;
const TIMER = /טיימר|קוצב זמן/;
const TEMPERATURE = /טמפרטור|תרמוסטט|בקרת חום|ווסת|דרגות חום/;
const SAFETY = /בטיחות|הגנה|כיבוי אוטומטי/;
const PROGRAMS = /(מספר )?(תוכניות|תכניות|פונקציות|מצבי (עבודה|הפעלה|ניקוי))/;

const BIG_APPLIANCE_TAIL: SpecGroupId[] = ["design", "smart", "connectivity", "display", "safety", "identity", "warranty"];

const FAMILIES = {
  cooling: {
    id: "cooling",
    keys: [
      /^נפח (כולל|נטו כולל|כללי|נטו|ברוטו)|^נפח$/,
      "dims",
      /שיטת (קירור|הפשרה)|^הפשרה|no ?frost/i,
      ENERGY_CLASS,
      /^נפח תא הקפאה/,
      /צריכת (אנרגיה|חשמל) שנתית/,
      NOISE,
      COLOR,
      /^מדחס/,
    ],
    groups: ["capacity", "dimensions", "performance", "energy", "noise", "programs", "installation", ...BIG_APPLIANCE_TAIL],
    openGroups: ["dimensions"],
    installFirst: true,
  },
  laundry: {
    id: "laundry",
    keys: [
      /^קיבולת|^נפח תוף/,
      /מהירות סחיטה/,
      /(שיטת|טכנולוגיית) ייבוש/,
      ENERGY_CLASS,
      "dims",
      /^(סוג )?מנוע/,
      NOISE,
      /מספר תוכניות/,
      /צריכת מים/,
    ],
    groups: ["capacity", "performance", "programs", "dimensions", "energy", "noise", "installation", ...BIG_APPLIANCE_TAIL],
    openGroups: ["dimensions"],
    installFirst: true,
  },
  dishwasher: {
    id: "dishwasher",
    keys: [/^קיבולת|מערכות כלים/, /סוג התקנה/, "dims", NOISE, /צריכת מים/, ENERGY_CLASS, /מספר תוכניות|תוכניות הדחה/],
    groups: ["capacity", "dimensions", "installation", "programs", "noise", "energy", "performance", ...BIG_APPLIANCE_TAIL],
    openGroups: ["dimensions"],
    installFirst: true,
  },
  oven: {
    id: "oven",
    keys: [
      /^נפח/,
      /^סוג( התקנה| תנור)?$/,
      /מידות נישה/,
      "dims",
      PROGRAMS,
      /טווח טמפרטור/,
      /ניקוי/,
      ENERGY_CLASS,
      /^הספק (מרבי|מקסימלי)/,
    ],
    groups: ["capacity", "dimensions", "installation", "programs", "performance", "energy", ...BIG_APPLIANCE_TAIL],
    openGroups: ["dimensions"],
    installFirst: true,
  },
  cooktop: {
    id: "cooktop",
    keys: [
      /^סוג( כיריים| משטח| מוצר)?$|חומר (ה)?משטח/,
      /מספר (מבערים|אזורי|מוקדי)|^מבערים/,
      /חיתוך/,
      "dims",
      /^הספק( כולל)?$/,
      /הצתה/,
      /חיישני|בטיחות/,
      /חיבור חשמל|סוג גז/,
    ],
    groups: ["performance", "capacity", "dimensions", "installation", "safety", "design", "energy", "programs", "display", "identity", "warranty"],
    openGroups: ["dimensions"],
    installFirst: true,
  },
  hood: {
    id: "hood",
    keys: [/^רוחב/, /(עוצמת|הספק|קצב) (שאיבה|יניקה)/, NOISE, /מספר מהירויות/, /^תאורה/, /מסננ/, /קוטר יציאת/],
    groups: ["performance", "dimensions", "installation", "noise", "design", "energy", "safety", "identity", "warranty"],
    openGroups: ["dimensions"],
    installFirst: true,
  },
  microwave: {
    id: "microwave",
    keys: [/^נפח|^קיבולת/, /^הספק מיקרוגל|^הספק$/, /גריל/, "dims", /^סוג$/, /קוטר צלחת/, /(דרגות|רמות) עוצמה/, PROGRAMS],
    groups: ["capacity", "performance", "programs", "dimensions", "design", "safety", "display", "energy", "installation", "identity", "warranty"],
    openGroups: [],
  },
  display: {
    id: "display",
    keys: [
      /גודל מסך/,
      /רזולוציה/,
      /סוג (פאנל|תצוגה|תאורה)|טכנולוגיית תצוגה/,
      /קצב רענון/,
      /מערכת הפעלה/,
      /HDR/,
      /HDMI/,
      /בהירות|לומן/,
      "dims",
    ],
    groups: ["display", "smart", "connectivity", "audio", "dimensions", "performance", "installation", "energy", "design", "identity", "warranty"],
    openGroups: [],
  },
  audio: {
    id: "audio",
    keys: [
      /^הספק( יציאה| מקסימלי| שמע| מרבי)?$/,
      /קישוריות|בלוטו|bluetooth/i,
      /תצורת|ערוצים/,
      /זמן עבודה|חיי סוללה|^סוללה/,
      /^(כניסות|חיבורים)/,
      /עמידות|IPX?\d/,
      /טווח תדרים/,
      WEIGHT,
    ],
    groups: ["audio", "connectivity", "performance", "energy", "dimensions", "smart", "display", "design", "identity", "warranty"],
    openGroups: [],
  },
  airConditioner: {
    id: "airConditioner",
    keys: [
      /תפוקת קירור/,
      /כוח סוס|כ"ס|כ״ס/,
      /תפוקת חימום/,
      ENERGY_CLASS,
      /SEER|מקדם יעילות/,
      /^סוג מזגן|טכנולוגיה|אינוורטר|inverter/i,
      NOISE,
      /wi-?fi/i,
    ],
    groups: ["capacity", "performance", "energy", "smart", "programs", "noise", "installation", "dimensions", "design", "safety", "identity", "warranty"],
    openGroups: [],
    installFirst: true,
  },
  heating: {
    id: "heating",
    keys: [POWER, /דרגות (חום|חימום)|עוצמות חימום/, /שטח|גודל חדר/, /גוף חימום|גופי חימום/, TIMER, /הגנה בנפילה|הגנה|בטיחות/, TEMPERATURE],
    groups: ["performance", "safety", "dimensions", "programs", "design", "energy", "installation", "identity", "warranty"],
    openGroups: [],
  },
  fan: {
    id: "fan",
    keys: [/^קוטר/, /מספר מהירויות|^מהירויות/, POWER, /^סוג$/, /שלט/, /צידוד|תנודה/, TIMER, NOISE, /נפח מיכל/, /שטח/],
    groups: ["performance", "dimensions", "programs", "noise", "design", "safety", "energy", "installation", "identity", "warranty"],
    openGroups: [],
  },
  vacuum: {
    id: "vacuum",
    keys: [
      /עוצמת שאיבה|כוח שאיבה/,
      /ניווט/,
      /זמן עבודה/,
      /^(קיבולת )?סוללה|קיבולת סוללה/,
      /זמן טעינה/,
      /נפח (מיכל|מכל|שקית)|קיבולת מיכל/,
      /סינון|מסנן|hepa/i,
      WEIGHT,
      NOISE,
    ],
    groups: ["performance", "capacity", "energy", "dimensions", "programs", "noise", "smart", "connectivity", "design", "installation", "identity", "warranty"],
    openGroups: [],
  },
  hotDrinks: {
    id: "hotDrinks",
    keys: [CAPACITY, POWER, /חומר( גוף)?|גוף הקומקום/, /גוף חימום/, TEMPERATURE, /^ברז|סוג ברז/, /^בסיס/, SAFETY, /שבת/],
    groups: ["capacity", "performance", "design", "safety", "programs", "dimensions", "display", "energy", "identity", "warranty"],
    openGroups: [],
  },
  coffee: {
    id: "coffee",
    keys: [/^סוג/, /לחץ משאבה/, /(נפח|קיבולת) (מיכל|מכל) (ה)?מים/, POWER, /טחינה|פולי/, /קפסולות/, /הקצפ|מקציף|חלב/, "dims"],
    groups: ["performance", "capacity", "programs", "dimensions", "design", "display", "energy", "safety", "identity", "warranty"],
    openGroups: [],
  },
  foodPrep: {
    id: "foodPrep",
    keys: [
      /^הספק( מנוע| עבודה)?/,
      /^סוג/,
      CAPACITY,
      /מספר מהירויות|^מהירויות|בורר מהירויות/,
      /קצב טחינה/,
      /חומר (ה)?(קערה|קנקן|כד)/,
      /להב/,
      /אביזרים/,
    ],
    groups: ["performance", "capacity", "design", "programs", "dimensions", "safety", "energy", "identity", "warranty"],
    openGroups: [],
  },
  smallCooking: {
    id: "smallCooking",
    keys: [
      CAPACITY,
      POWER,
      /ייצור|קצב ייצור|כושר ייצור/,
      /פרוסות|פתחים/,
      TEMPERATURE,
      TIMER,
      PROGRAMS,
      /ציפוי|פלטות|משטח/,
      "dims",
    ],
    groups: ["capacity", "performance", "programs", "design", "dimensions", "safety", "display", "energy", "identity", "warranty"],
    openGroups: [],
  },
  shabbat: {
    id: "shabbat",
    keys: [/מידות (ה)?משטח|^מידות/, CAPACITY, POWER, TEMPERATURE, /חומר (ה)?משטח/, /רגליות/],
    groups: ["dimensions", "capacity", "performance", "design", "safety", "energy", "identity", "warranty"],
    openGroups: [],
  },
  personalCare: {
    id: "personalCare",
    keys: [
      /מערכת גילוח|^סוג( מכונה| מנוע)?$/,
      POWER,
      /זמן (עבודה|פעולה)/,
      /^(סוג )?סוללה/,
      /זמן טעינה/,
      /עמידות|IPX|רטוב/,
      /אורך חיתוך|מסרק|דרגות אורך/,
      /דרגות|הגדרות|טמפרטור/,
      /אביזרים/,
    ],
    groups: ["performance", "energy", "programs", "design", "safety", "dimensions", "display", "identity", "warranty"],
    openGroups: [],
  },
  garmentCare: {
    id: "garmentCare",
    keys: [POWER, /תפוקת אדים|קצב יציאת אדים/, /מכת|מטח/, /לחץ (קיטור|אדים)/, /(נפח|קיבולת) (מיכל|מכל)/, /תחתית|סוליה/, /זמן חימום/, SAFETY],
    groups: ["performance", "capacity", "design", "safety", "dimensions", "energy", "identity", "warranty"],
    openGroups: [],
  },
  phone: {
    id: "phone",
    keys: [/^(צג|תצוגה|מסך)/, /טכנולוגי/, /זמן דיבור/, /זמן המתנה/, /טווח/, /סוללות?/, /דיבורית/, /זיהוי שיחה/],
    groups: ["display", "connectivity", "performance", "energy", "programs", "design", "identity", "warranty"],
    openGroups: [],
  },
  general: {
    id: "general",
    keys: [CAPACITY, POWER, /^סוג/, /זמן עבודה/, "dims"],
    groups: [],
    openGroups: [],
  },
} satisfies Record<string, ProductFamily>;

type FamilyId = keyof typeof FAMILIES;

const CATEGORY_FAMILY: Record<string, FamilyId> = {
  refrigerators: "cooling",
  freezers: "cooling",
  "wine-coolers": "cooling",
  "washing-machines": "laundry",
  dryers: "laundry",
  dishwashers: "dishwasher",
  ovens: "oven",
  "microwave-ovens": "oven",
  cooktops: "cooktop",
  "hot-plates": "cooktop",
  "range-hoods": "hood",
  microwaves: "microwave",
  tvs: "display",
  monitors: "display",
  projectors: "display",
  speakers: "audio",
  soundbars: "audio",
  amplifiers: "audio",
  "stereo-systems": "audio",
  radios: "audio",
  headphones: "audio",
  strymrym: "audio",
  converters: "audio",
  "air-conditioners": "airConditioner",
  heaters: "heating",
  "space-heaters": "heating",
  "heating-pads": "heating",
  "electric-blankets": "heating",
  fans: "fan",
  "air-coolers": "fan",
  "air-purifiers": "fan",
  "vacuum-cleaners": "vacuum",
  "robot-vacuums": "vacuum",
  kettles: "hotDrinks",
  humidifiers: "hotDrinks",
  "milk-frothers": "hotDrinks",
  "water-dispensers": "hotDrinks",
  "coffee-machines": "coffee",
  "coffee-grinders": "coffee",
  blenders: "foodPrep",
  mixers: "foodPrep",
  "food-processors": "foodPrep",
  juicers: "foodPrep",
  trimmers: "foodPrep",
  "meat-grinders": "foodPrep",
  toasters: "smallCooking",
  "toaster-ovens": "smallCooking",
  "air-fryers": "smallCooking",
  "deep-fryers": "smallCooking",
  "electric-grills": "smallCooking",
  "grill-pans": "smallCooking",
  "panini-grills": "smallCooking",
  "waffle-makers": "smallCooking",
  "electric-pans": "smallCooking",
  "cooking-pots": "smallCooking",
  "popcorn-makers": "smallCooking",
  "avpy-lchm": "smallCooking",
  "ice-makers": "smallCooking",
  "ice-cream-makers": "smallCooking",
  "shabbat-hot-plates": "shabbat",
  "hair-dryers": "personalCare",
  "hair-stylers": "personalCare",
  "hair-clippers": "personalCare",
  shavers: "personalCare",
  epilators: "personalCare",
  "electric-toothbrushes": "personalCare",
  scales: "personalCare",
  irons: "garmentCare",
  "steam-cleaners": "garmentCare",
  phones: "phone",
};

export function productFamily(product: Pick<Product, "categorySlug">): ProductFamily {
  const id = product.categorySlug ? CATEGORY_FAMILY[product.categorySlug] : undefined;
  return FAMILIES[id ?? "general"];
}

/**
 * Rows a buyer rarely compares on: identifiers, mains voltage, cable length.
 * Never a tile, always at the bottom of the sheet. Still shown — someone
 * checking a barcode against a box needs it.
 */
const LOW_PRIORITY =
  /^(דגם|מק"?ט|מק״ט|ברקוד|EAN|מותג|יצרן|קוד מוצר|שם הדגם|סדרה|ארץ ייצור|מקום ייצור)|מתח|תדר|^זרם|אורך כבל|כבל (חשמל|הזנה)|אחסון כבל/i;

/** Labels that describe a measurement; used to sort the sheet for the "dims" key. */
const DIMENSION_LABEL = /^(מידות|רוחב|גובה|עומק|משקל)/;

const MAX_LABEL = 40;
const MAX_TILE_VALUE = 56;

/**
 * Feed sheets often arrive as one run-on line — "הספק: 1300W. קוטר: 16.5
 * ס״מ. מידות: ..." — that the catalog parser keeps as a single row. For
 * display only, split a row wherever ". " or ", " is followed by another
 * short "label:" pair. Normalized specs are untouched, so descriptions,
 * structured data and the dimension guides read exactly what they did.
 */
export function expandSpecRows(specs: SpecEntry[]): SpecEntry[] {
  const out: SpecEntry[] = [];
  const boundary = /[.,]\s+(?=[^\s\d:.,;][^:.,;]{0,31}:\s)/g;
  for (const spec of specs) {
    if (spec.label.length > MAX_LABEL) {
      // A sentence the parser mistook for a label; show it as plain text.
      out.push({ label: "", value: `${spec.label}: ${spec.value}` });
      continue;
    }
    const parts = spec.value.split(boundary);
    parts.forEach((part, index) => {
      const text = part.trim().replace(/\.$/, "");
      if (!text) return;
      if (index === 0) {
        out.push({ label: spec.label, value: text });
        return;
      }
      const match = text.match(/^(.+?):\s*(.+)$/);
      out.push(match ? { label: match[1].trim(), value: match[2].trim() } : { label: "", value: text });
    });
  }
  return out;
}

function matches(token: KeyToken, label: string): boolean {
  return token === "dims" ? DIMENSION_LABEL.test(label) : token.test(label);
}

function cm(value: number): string {
  return value.toLocaleString("he-IL", { maximumFractionDigits: 1 });
}

export interface KeyFact {
  label: string;
  value: string;
}

/**
 * The few facts that decide between two models of this kind, in the
 * family's order. Fewer than `max` when the record does not carry them.
 */
export function keyFacts(product: Product, max = 5): KeyFact[] {
  const family = productFamily(product);
  const rows = expandSpecRows(product.specs).filter(
    (row) => row.label && row.label.length <= MAX_LABEL && !LOW_PRIORITY.test(row.label)
  );
  const used = new Set<SpecEntry>();
  const facts: KeyFact[] = [];

  for (const token of family.keys) {
    if (facts.length >= max) break;
    if (token === "dims") {
      const body = measure(product)?.body;
      if (body) {
        const isDisplay = family.id === "display";
        facts.push({
          label: isDisplay ? "מידות ללא מעמד (ר×ג×ע)" : "מידות (ר×ג×ע)",
          value: `${cm(body.widthCm)} × ${cm(body.heightCm)} × ${cm(body.depthCm)} ס״מ`,
        });
        // The separate width/height/depth rows are now said; keep them off the tiles.
        for (const row of rows) if (/^(מידות|רוחב|גובה|עומק)/.test(row.label)) used.add(row);
        continue;
      }
      const dims = rows.find((row) => !used.has(row) && /^מידות/.test(row.label) && row.value.length <= MAX_TILE_VALUE);
      if (dims) {
        used.add(dims);
        facts.push({ label: dims.label, value: dims.value });
      }
      continue;
    }
    const row = rows.find((r) => !used.has(r) && token.test(r.label) && r.value.length <= MAX_TILE_VALUE);
    if (row) {
      used.add(row);
      facts.push({ label: row.label, value: row.value });
    }
  }
  return facts;
}

/** The whole sheet, the family's key facts first and identifiers last. */
export function sortSpecRows(rows: SpecEntry[], family: ProductFamily): SpecEntry[] {
  const score = (row: SpecEntry) => {
    if (!row.label) return 900;
    if (LOW_PRIORITY.test(row.label)) return 1000;
    const index = family.keys.findIndex((token) => matches(token, row.label));
    return index === -1 ? 500 : index;
  };
  return rows
    .map((row, index) => ({ row, index, score: score(row) }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map(({ row }) => row);
}

const GROUP_TAIL: SpecGroupId[] = ["identity", "warranty"];

/** Research spec groups in the family's order, identity and warranty last. */
export function orderSpecGroups<T extends { id: SpecGroupId }>(groups: T[], family: ProductFamily): T[] {
  const order = [
    ...family.groups,
    ...(Object.keys(SPEC_GROUPS) as SpecGroupId[]).filter((id) => !family.groups.includes(id) && !GROUP_TAIL.includes(id)),
    ...GROUP_TAIL.filter((id) => !family.groups.includes(id)),
  ];
  return [...groups].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}
