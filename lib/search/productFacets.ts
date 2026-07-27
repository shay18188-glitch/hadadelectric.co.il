import type { Product } from "@/types/product";
import { normalizeHebrewSearch } from "@/lib/search/normalizeHebrew";

export const FACET_PARAM_PREFIX = "f_";

export type FacetSelections = Record<string, string[]>;

export interface ProductFacetOption {
  value: string;
  label: string;
  query: string;
  count: number;
}

export interface ProductFacetGroup {
  key: string;
  label: string;
  options: ProductFacetOption[];
}

interface FacetContext {
  product: Product;
  text: string;
  name: string;
}

interface FacetOptionDefinition {
  value: string;
  label: string;
  query: string;
  queryTerms: string[];
  matches: (context: FacetContext) => boolean;
}

interface FacetDefinition {
  key: string;
  label: string;
  options: FacetOptionDefinition[];
  maxOptions?: number;
}

const facetContextCache = new WeakMap<Product, FacetContext>();

function normalizedTerms(terms: string[]): string[] {
  return terms.map(normalizeHebrewSearch);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(text: string, phrase: string): boolean {
  return new RegExp(`(^|\\s)${escapeRegExp(phrase)}(?=\\s|$)`).test(text);
}

function hasAnyText(text: string, terms: string[]): boolean {
  return normalizedTerms(terms).some((term) => containsPhrase(text, term));
}

function keywordOption(
  value: string,
  label: string,
  terms: string[],
  query = label,
  excludeTerms: string[] = []
): FacetOptionDefinition {
  const normalized = normalizedTerms(terms);
  const exclusions = normalizedTerms(excludeTerms);
  return {
    value,
    label,
    query,
    queryTerms: [label, query, ...terms],
    matches: ({ text }) => normalized.some((term) => text.includes(term)) && !exclusions.some((term) => text.includes(term)),
  };
}

function exactKeywordOption(value: string, label: string, terms: string[], query = label): FacetOptionDefinition {
  const normalized = normalizedTerms(terms);
  return {
    value,
    label,
    query,
    queryTerms: [label, query, ...terms],
    matches: ({ text }) => normalized.some((term) => containsPhrase(text, term)),
  };
}

function colorOption(value: string, label: string, terms: string[], query = label): FacetOptionDefinition {
  const normalized = normalizedTerms(terms);
  return {
    value,
    label,
    query,
    queryTerms: [label, query, ...terms],
    matches: ({ text, name }) => normalized.some((term) =>
      containsPhrase(name, term) ||
      new RegExp(`(?:צבע|גימור)[^\\d]{0,16}(^|\\s)${escapeRegExp(term)}(?=\\s|$)`).test(text)
    ),
  };
}

function numericValues(text: string, unitPattern: string, min: number, max: number): number[] {
  const values: number[] = [];
  const normalizedUnitPattern = unitPattern
    .split("|")
    .map((part) => normalizeHebrewSearch(part))
    .join("|");
  const expression = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${normalizedUnitPattern})`, "gi");
  for (const match of text.matchAll(expression)) {
    const value = Number(match[1]);
    if (Number.isFinite(value) && value >= min && value <= max) values.push(value);
  }
  return values;
}

function measurementValue(context: FacetContext, unitPattern: string, min: number, max: number, largest = false): number | null {
  const nameValues = numericValues(context.name, unitPattern, min, max);
  const values = nameValues.length > 0 ? nameValues : numericValues(context.text, unitPattern, min, max);
  if (values.length === 0) return null;
  return largest ? Math.max(...values) : values[0];
}

function widthValue(context: FacetContext): number | null {
  const labeled = context.text.match(/(?:רוחב|width)[^\d]{0,18}(\d+(?:\.\d+)?)\s*(?:סמ|cm)/i);
  if (labeled) {
    const value = Number(labeled[1]);
    if (value >= 25 && value <= 110) return value;
  }
  const nameValues = numericValues(context.name, "סמ|cm", 25, 110);
  return nameValues[0] ?? null;
}

function widthOption(value: string, label: string, min: number, max: number, query = label): FacetOptionDefinition {
  return {
    value,
    label,
    query,
    queryTerms: [label, query],
    matches: (context) => {
      const width = widthValue(context);
      return width !== null && width >= min && width <= max;
    },
  };
}

function numericOption({
  value,
  label,
  query = label,
  unitPattern,
  min,
  max,
  measurementMin,
  measurementMax,
  largest,
  queryTerms = [],
}: {
  value: string;
  label: string;
  query?: string;
  unitPattern: string;
  min: number;
  max: number;
  measurementMin: number;
  measurementMax: number;
  largest?: boolean;
  queryTerms?: string[];
}): FacetOptionDefinition {
  return {
    value,
    label,
    query,
    queryTerms: [label, query, ...queryTerms],
    matches: (context) => {
      const measured = measurementValue(context, unitPattern, measurementMin, measurementMax, largest);
      return measured !== null && measured >= min && measured <= max;
    },
  };
}

function exactMeasurementOptions(
  values: number[],
  unitPattern: string,
  labelFor: (value: number) => string,
  queryFor: (value: number) => string,
  measurementMin: number,
  measurementMax: number
): FacetOptionDefinition[] {
  return values.map((value) => ({
    value: String(value),
    label: labelFor(value),
    query: queryFor(value),
    queryTerms: [labelFor(value), queryFor(value)],
    matches: (context) => measurementValue(context, unitPattern, measurementMin, measurementMax) === value,
  }));
}

const colorFacet: FacetDefinition = {
  key: "color",
  label: "צבע וגימור",
  maxOptions: 7,
  options: [
    colorOption("black", "שחור", ["שחור", "black"]),
    colorOption("white", "לבן", ["לבן", "white"]),
    colorOption("stainless", "נירוסטה / Inox", ["נירוסטה", "inox"]),
    colorOption("silver", "כסוף / אפור", ["כסוף", "אפור", "גרפיט", "silver", "grey", "gray"]),
    colorOption("cream", "קרם / בז׳", ["קרם", "שמנת", "בז"]),
    colorOption("red", "אדום", ["אדום"]),
    colorOption("blue", "כחול", ["כחול"]),
  ],
};

const powerFacet: FacetDefinition = {
  key: "power",
  label: "הספק",
  options: [
    numericOption({ value: "up-to-800", label: "עד 800W", unitPattern: "w|וואט", min: 1, max: 800, measurementMin: 1, measurementMax: 5000 }),
    numericOption({ value: "801-1500", label: "801–1500W", unitPattern: "w|וואט", min: 801, max: 1500, measurementMin: 1, measurementMax: 5000 }),
    numericOption({ value: "1501-2200", label: "1501–2200W", unitPattern: "w|וואט", min: 1501, max: 2200, measurementMin: 1, measurementMax: 5000 }),
    numericOption({ value: "over-2200", label: "מעל 2200W", unitPattern: "w|וואט", min: 2201, max: 5000, measurementMin: 1, measurementMax: 5000 }),
  ],
};

const volumeFacet: FacetDefinition = {
  key: "volume",
  label: "נפח כולל",
  options: [
    numericOption({ value: "up-to-400", label: "עד 400 ליטר", unitPattern: "ליטר|l", min: 50, max: 400, measurementMin: 50, measurementMax: 1000, largest: true }),
    numericOption({ value: "401-550", label: "401–550 ליטר", unitPattern: "ליטר|l", min: 401, max: 550, measurementMin: 50, measurementMax: 1000, largest: true }),
    numericOption({ value: "551-650", label: "551–650 ליטר", unitPattern: "ליטר|l", min: 551, max: 650, measurementMin: 50, measurementMax: 1000, largest: true }),
    numericOption({ value: "over-650", label: "מעל 650 ליטר", unitPattern: "ליטר|l", min: 651, max: 1000, measurementMin: 50, measurementMax: 1000, largest: true }),
  ],
};

const loadCapacityFacet: FacetDefinition = {
  key: "load",
  label: "קיבולת",
  options: exactMeasurementOptions([6, 7, 8, 9, 10, 11, 12], "קג|kg", (value) => `${value} ק״ג`, (value) => `${value} קג`, 5, 15),
};

const screenSizeFacet: FacetDefinition = {
  key: "screen-size",
  label: "גודל מסך",
  maxOptions: 9,
  options: exactMeasurementOptions([32, 40, 43, 50, 55, 58, 65, 70, 75, 77, 83, 85, 98, 100], "אינצ|inch", (value) => `${value} אינץ׳`, (value) => `${value} אינץ`, 20, 120),
};

const widthFacet: FacetDefinition = {
  key: "width",
  label: "רוחב",
  options: [
    widthOption("45", "45 ס״מ", 43, 47, "45 סמ"),
    widthOption("60", "60 ס״מ", 58, 62, "60 סמ"),
    widthOption("70-75", "70–75 ס״מ", 69, 76),
    widthOption("80-90", "80–90 ס״מ", 79, 92),
  ],
};

const shabbatFacet: FacetDefinition = {
  key: "shabbat",
  label: "התאמה לשבת",
  options: [keywordOption("yes", "מצב / פיקוד שבת", ["מצב שבת", "פיקוד שבת", "תוכנית שבת", "שומר שבת", "שבת וחג", "שבת"], "שומר שבת")],
};

const wifiFacet: FacetDefinition = {
  key: "wifi",
  label: "שליטה חכמה",
  options: [keywordOption("yes", "Wi‑Fi / אפליקציה", ["wifi", "wi fi", "wi-fi", "אפליקציה", "שליטה מרחוק"], "WiFi")],
};

const inverterFacet: FacetDefinition = {
  key: "inverter",
  label: "טכנולוגיית מנוע",
  options: [keywordOption("yes", "Inverter", ["inverter", "אינוורטר"], "אינוורטר")],
};

const CATEGORY_DEFINITIONS: Record<string, FacetDefinition[]> = {
  refrigerators: [
    volumeFacet,
    {
      key: "doors",
      label: "מספר דלתות",
      options: [2, 3, 4, 5].map((doors) => ({
        value: String(doors),
        label: `${doors} דלתות`,
        query: `${doors} דלתות`,
        queryTerms: [`${doors} דלתות`],
        matches: ({ text }) => new RegExp(`(^|\\s)${doors}\\s*דלת(?:ות)?(?=\\s|$)`).test(text),
      })),
    },
    {
      key: "freezer-position",
      label: "מיקום המקפיא",
      options: [
        keywordOption("top", "מקפיא עליון", ["מקפיא עליון"]),
        keywordOption("bottom", "מקפיא תחתון", ["מקפיא תחתון"]),
        keywordOption("side", "Side by Side", ["side by side", "סייד ביי סייד", "מקפיא צד"]),
      ],
    },
    widthFacet,
    {
      key: "cooling",
      label: "שיטת קירור",
      options: [
        exactKeywordOption("no-frost", "No Frost", ["no frost", "nofrost", "נו פרוסט", "total no frost", "nf"]),
        keywordOption("dual", "קירור כפול", ["dual cooling", "twin cooling", "קירור כפול"]),
      ],
    },
    shabbatFacet,
    inverterFacet,
    {
      key: "water-ice",
      label: "מים וקרח",
      options: [
        keywordOption("water", "בר מים", ["בר מים", "דיספנסר מים", "מתקן מים"]),
        keywordOption("ice", "יצרן קרח", ["יצרן קרח", "מייצר קרח", "ice maker"]),
      ],
    },
  ],
  "washing-machines": [
    loadCapacityFacet,
    {
      key: "spin",
      label: "מהירות סחיטה",
      options: exactMeasurementOptions([1000, 1200, 1400, 1600], "סלד|rpm", (value) => `${value} סל״ד`, (value) => `${value} סלד`, 800, 1800),
    },
    {
      key: "loading",
      label: "סוג פתח",
      options: [
        {
          value: "front",
          label: "פתח קדמי",
          query: "פתח קדמי",
          queryTerms: ["פתח קדמי", "פתח חזית"],
          matches: ({ text }) => hasAnyText(text, ["פתח קדמי", "פתח חזית"]) || !hasAnyText(text, ["פתח עליון"]),
        },
        keywordOption("top", "פתח עליון", ["פתח עליון"]),
      ],
    },
    inverterFacet,
    { key: "steam", label: "תוכניות מיוחדות", options: [keywordOption("yes", "קיטור / Steam", ["קיטור", "steam"])] },
    wifiFacet,
  ],
  dryers: [
    loadCapacityFacet,
    {
      key: "drying-technology",
      label: "טכנולוגיית ייבוש",
      options: [
        keywordOption("heat-pump", "Heat Pump", ["heat pump", "היט פאמפ", "משאבת חום"]),
        keywordOption("condenser", "קונדנסור", ["קונדנסור", "condenser"], "קונדנסור", ["heat pump", "משאבת חום"]),
        keywordOption("vented", "עם צינור פליטה", ["צינור פליטה", "פתח אוורור", "vented"]),
      ],
    },
    { key: "drying-sensor", label: "חיישנים", options: [keywordOption("yes", "חיישני לחות / ייבוש", ["חיישן לחות", "חיישני לחות", "חיישני ייבוש", "sensor dry"])] },
    inverterFacet,
    wifiFacet,
  ],
  tvs: [
    screenSizeFacet,
    {
      key: "display",
      label: "טכנולוגיית תצוגה",
      options: [
        keywordOption("oled", "OLED", ["oled"]),
        keywordOption("mini-led", "Mini LED", ["mini led", "miniled", "neo qled"]),
        keywordOption("qled", "QLED", ["qled"], "QLED", ["mini led", "miniled", "neo qled"]),
        keywordOption("nanocell", "NanoCell", ["nanocell", "nano cell"]),
        keywordOption("led", "LED", [" led ", "uhd led"], "LED", ["oled", "qled", "mini led", "nanocell"]),
      ],
    },
    {
      key: "resolution",
      label: "רזולוציה",
      options: [
        keywordOption("8k", "8K", ["8k"]),
        keywordOption("4k", "4K UHD", ["4k", "ultra hd", "uhd"]),
        keywordOption("full-hd", "Full HD", ["full hd", "fhd"]),
        keywordOption("hd", "HD", [" hd "], "HD", ["full hd", "ultra hd"]),
      ],
    },
    {
      key: "gaming",
      label: "גיימינג וקצב רענון",
      options: [
        keywordOption("120hz", "120Hz ומעלה", ["120hz", "120 hz", "144hz", "144 hz", "165hz", "288hz"]),
        keywordOption("hdmi21", "HDMI 2.1", ["hdmi 2.1", "hdmi2.1"]),
        keywordOption("vrr", "VRR / FreeSync", ["vrr", "freesync", "g sync", "g-sync"]),
      ],
    },
    {
      key: "smart-tv",
      label: "מערכת חכמה",
      options: [
        keywordOption("google-tv", "Google TV / Android", ["google tv", "android tv", "android"]),
        keywordOption("tizen", "Tizen", ["tizen"]),
        keywordOption("webos", "webOS", ["webos", "web os"]),
      ],
    },
  ],
  ovens: [
    {
      key: "oven-volume",
      label: "נפח תא אפייה",
      options: [
        numericOption({ value: "compact", label: "עד 50 ליטר", unitPattern: "ליטר|l", min: 20, max: 50, measurementMin: 20, measurementMax: 100, largest: true }),
        numericOption({ value: "51-70", label: "51–70 ליטר", unitPattern: "ליטר|l", min: 51, max: 70, measurementMin: 20, measurementMax: 100, largest: true }),
        numericOption({ value: "over-70", label: "מעל 70 ליטר", unitPattern: "ליטר|l", min: 71, max: 100, measurementMin: 20, measurementMax: 100, largest: true }),
      ],
    },
    {
      key: "cleaning",
      label: "שיטת ניקוי",
      options: [
        keywordOption("pyrolytic", "פירוליטי", ["פירוליטי", "פירוליזה", "pyrolytic"]),
        keywordOption("catalytic", "קטליטי", ["קטליטי", "catalytic"]),
        keywordOption("steam", "ניקוי באדים", ["ניקוי באדים", "aqua clean", "hydro clean"]),
      ],
    },
    { key: "steam", label: "אפשרויות אפייה", options: [keywordOption("yes", "אפייה באדים", ["אפייה באדים", "אידוי", "steam cooking"])] },
    { key: "oven-control", label: "סוג הפעלה", options: [keywordOption("digital", "דיגיטלי / מגע", ["דיגיטלי", "תצוגת מגע", "touch"]), keywordOption("mechanical", "מכני", ["מכני"])] },
    shabbatFacet,
  ],
  cooktops: [
    {
      key: "cooktop-type",
      label: "סוג כיריים",
      options: [
        keywordOption("induction", "אינדוקציה", ["אינדוקציה", "induction"]),
        keywordOption("gas", "גז", ["כיריים גז", "כירת גז", "מבער גז"]),
        keywordOption("ceramic", "קרמיות", ["קרמי", "קרמית", "קרמיות", "vitroceramic"]),
      ],
    },
    widthFacet,
    {
      key: "zones",
      label: "מספר אזורי בישול",
      options: [2, 3, 4, 5, 6].map((zones) => ({
        value: String(zones), label: `${zones} אזורים / להבות`, query: `${zones} להבות`, queryTerms: [`${zones} להבות`, `${zones} מבערים`, `${zones} אזורי בישול`],
        matches: ({ text }) => new RegExp(`(^|\\s)${zones}\\s*(?:להבות|מבערימ|אזורי בישול)`).test(text),
      })),
    },
    {
      key: "phase",
      label: "חיבור חשמל",
      options: [keywordOption("single", "חד־פאזי", ["חד פאזי", "1 פאזי"]), keywordOption("three", "תלת־פאזי", ["תלת פאזי", "3 פאזי"])],
    },
  ],
  dishwashers: [
    {
      key: "installation",
      label: "סוג התקנה",
      options: [
        keywordOption("fully-integrated", "אינטגרלי מלא", ["אינטגרלי מלא"]),
        keywordOption("semi-integrated", "חצי אינטגרלי", ["חצי אינטגרלי"]),
        keywordOption("freestanding", "רגיל / עומד", ["רחב רגיל", "צר רגיל", "עומד", "freestanding"], "מדיח רגיל", ["אינטגרלי"]),
      ],
    },
    widthFacet,
    {
      key: "place-settings",
      label: "מערכות כלים",
      options: [
        numericOption({ value: "up-to-10", label: "עד 10 מערכות כלים", unitPattern: "מקומות|מערכות כלים", min: 1, max: 10, measurementMin: 1, measurementMax: 18 }),
        numericOption({ value: "11-13", label: "11–13 מערכות כלים", unitPattern: "מקומות|מערכות כלים", min: 11, max: 13, measurementMin: 1, measurementMax: 18 }),
        numericOption({ value: "14-plus", label: "14 ומעלה", unitPattern: "מקומות|מערכות כלים", min: 14, max: 18, measurementMin: 1, measurementMax: 18 }),
      ],
    },
    { key: "quiet", label: "רמת רעש", options: [numericOption({ value: "yes", label: "שקט — עד 44dB", unitPattern: "db|דציבל", min: 1, max: 44, measurementMin: 1, measurementMax: 80 })] },
    { key: "third-rack", label: "סידור פנימי", options: [keywordOption("yes", "מגירת סכו״ם שלישית", ["מגירת סכום", "מגירה שלישית", "3rd rack"])] },
    wifiFacet,
  ],
  "air-conditioners": [
    { key: "ac-type", label: "סוג מזגן", options: [keywordOption("wall", "עילי", ["מזגן עילי"]), keywordOption("portable", "נייד", ["מזגן נייד"]), keywordOption("mini-central", "מיני מרכזי", ["מיני מרכזי"])] },
    {
      key: "horsepower",
      label: "כוח סוס",
      options: exactMeasurementOptions([1, 1.5, 2, 2.5, 3, 3.5, 4], "כס|כוח סוס|hp", (value) => `${value} כ״ס`, (value) => `${value} כס`, 0.5, 5),
    },
    {
      key: "cooling-output",
      label: "תפוקת קירור",
      options: [
        numericOption({ value: "up-to-10000", label: "עד 10,000 BTU", unitPattern: "btu", min: 5000, max: 10000, measurementMin: 5000, measurementMax: 60000 }),
        numericOption({ value: "10001-18000", label: "10,001–18,000 BTU", unitPattern: "btu", min: 10001, max: 18000, measurementMin: 5000, measurementMax: 60000 }),
        numericOption({ value: "18001-25000", label: "18,001–25,000 BTU", unitPattern: "btu", min: 18001, max: 25000, measurementMin: 5000, measurementMax: 60000 }),
        numericOption({ value: "over-25000", label: "מעל 25,000 BTU", unitPattern: "btu", min: 25001, max: 60000, measurementMin: 5000, measurementMax: 60000 }),
      ],
    },
    inverterFacet,
    wifiFacet,
    shabbatFacet,
    { key: "quiet", label: "נוחות", options: [keywordOption("yes", "מצב שקט", ["מצב שקט", "פעולה שקטה", "quiet"])] },
  ],
  "vacuum-cleaners": [
    {
      key: "vacuum-type",
      label: "סוג שואב",
      options: [
        keywordOption("wet-dry", "שואב שוטף", ["שואב שוטף", "שוטף רצפות"]),
        keywordOption("cordless-stick", "אלחוטי עומד", ["אלחוטי", "נטען", "stick"], "שואב אלחוטי"),
        keywordOption("canister", "נגרר", ["שואב נגרר", "ציקלוני נגרר"]),
        keywordOption("handheld", "ידני", ["שואב ידני", "קומפקטי ידני"]),
      ],
    },
    { key: "steam", label: "ניקוי מתקדם", options: [keywordOption("yes", "ניקוי בקיטור", ["קיטור", "steam"])] },
    { key: "pet-hair", label: "שיער ופרווה", options: [keywordOption("yes", "מתאים לחיות מחמד", ["חיות מחמד", "פרווה", "pet", "נגד הסתבכות שיער"])] },
    { key: "self-clean", label: "תחזוקה", options: [keywordOption("yes", "ניקוי עצמי", ["ניקוי עצמי", "שטיפה עצמית", "ייבוש עצמי"])] },
  ],
  "robot-vacuums": [
    {
      key: "suction",
      label: "עוצמת שאיבה",
      options: [
        numericOption({ value: "up-to-8000", label: "עד 8,000Pa", unitPattern: "pa", min: 1000, max: 8000, measurementMin: 1000, measurementMax: 50000 }),
        numericOption({ value: "8001-15000", label: "8,001–15,000Pa", unitPattern: "pa", min: 8001, max: 15000, measurementMin: 1000, measurementMax: 50000 }),
        numericOption({ value: "over-15000", label: "מעל 15,000Pa", unitPattern: "pa", min: 15001, max: 50000, measurementMin: 1000, measurementMax: 50000 }),
      ],
    },
    {
      key: "dock",
      label: "תחנת עגינה",
      options: [
        keywordOption("auto-empty", "ריקון אבק אוטומטי", ["ריקון אבק אוטומטי", "ריקון אוטומטי"]),
        keywordOption("mop-wash", "שטיפת מופים", ["שטיפת מופים", "שטיפת מקרצפות", "שטיפה אוטומטית של המופים"]),
        keywordOption("hot-dry", "ייבוש בחום", ["ייבוש מופים", "ייבוש מקרצפות", "ייבוש באוויר חם", "ייבוש בחימום"]),
      ],
    },
    {
      key: "navigation",
      label: "ניווט וזיהוי",
      options: [
        keywordOption("laser", "ניווט לייזר / LDS", ["lds", "לייזר", "laser"]),
        keywordOption("ai-camera", "מצלמה וזיהוי AI", ["מצלמת rgb", "מצלמה ai", "זיהוי מכשולים מבוסס ai", "3d adapt"]),
      ],
    },
    { key: "mopping", label: "שטיפה", options: [keywordOption("yes", "שואב וגם שוטף", ["שואב ושוטף", "שאיבה ושטיפה", "מקרצף"])] },
    { key: "carpets", label: "שטיחים", options: [keywordOption("yes", "הרמת מופים לשטיח", ["הרמת מופים", "הרמת מקרצפות", "זיהוי שטיחים", "carpet boost"])] },
    { key: "pet-hair", label: "שיער ופרווה", options: [keywordOption("yes", "נגד הסתבכות שיער", ["נגד הסתבכות", "anti tangle", "tricut", "hyperstream", "פרווה"])] },
  ],
  microwaves: [
    {
      key: "microwave-volume",
      label: "נפח",
      options: [
        numericOption({ value: "up-to-23", label: "עד 23 ליטר", unitPattern: "ליטר|l", min: 10, max: 23, measurementMin: 10, measurementMax: 60, largest: true }),
        numericOption({ value: "24-30", label: "24–30 ליטר", unitPattern: "ליטר|l", min: 24, max: 30, measurementMin: 10, measurementMax: 60, largest: true }),
        numericOption({ value: "over-30", label: "מעל 30 ליטר", unitPattern: "ליטר|l", min: 31, max: 60, measurementMin: 10, measurementMax: 60, largest: true }),
      ],
    },
    { key: "microwave-features", label: "פונקציות", options: [keywordOption("grill", "גריל", ["גריל", "grill"]), keywordOption("convection", "טורבו / אפייה", ["טורבו", "קונבקציה", "convection", "אפייה"])] },
    { key: "installation", label: "סוג התקנה", options: [keywordOption("built-in", "בילט־אין", ["בילט אין", "בנוי", "אינטגרלי"]), keywordOption("countertop", "על השיש", ["עצמאי", "על השיש"], "מיקרוגל רגיל", ["בילט אין", "בנוי"])] },
    { key: "control", label: "הפעלה", options: [keywordOption("digital", "דיגיטלי", ["דיגיטלי", "מגע", "touch"]), keywordOption("mechanical", "מכני", ["מכני"])] },
    inverterFacet,
  ],
  freezers: [
    {
      key: "freezer-type",
      label: "מבנה המקפיא",
      options: [keywordOption("upright", "עומד / מגירות", ["מקפיא עומד", "מגירות"]), keywordOption("chest", "שוכב", ["מקפיא שוכב"])]
    },
    volumeFacet,
    { key: "drawers", label: "מספר מגירות", options: [3, 4, 5, 6, 7].map((drawers) => ({ value: String(drawers), label: `${drawers} מגירות`, query: `${drawers} מגירות`, queryTerms: [`${drawers} מגירות`], matches: ({ text }) => new RegExp(`(^|\\s)${drawers}\\s*מגירות`).test(text) })) },
    { key: "cooling", label: "שיטת קירור", options: [exactKeywordOption("no-frost", "No Frost", ["no frost", "nofrost", "נו פרוסט", "nf"])] },
    shabbatFacet,
  ],
  kettles: [
    { key: "capacity", label: "נפח", options: [numericOption({ value: "up-to-1.5", label: "עד 1.5 ליטר", unitPattern: "ליטר|l", min: 0.1, max: 1.5, measurementMin: 0.1, measurementMax: 3, largest: true }), numericOption({ value: "1.6-1.7", label: "1.6–1.7 ליטר", unitPattern: "ליטר|l", min: 1.6, max: 1.7, measurementMin: 0.1, measurementMax: 3, largest: true }), numericOption({ value: "over-1.7", label: "מעל 1.7 ליטר", unitPattern: "ליטר|l", min: 1.71, max: 3, measurementMin: 0.1, measurementMax: 3, largest: true })] },
    { key: "material", label: "חומר גוף", options: [keywordOption("stainless", "נירוסטה", ["נירוסטה", "inox"]), keywordOption("glass", "זכוכית", ["זכוכית"]), keywordOption("plastic", "פלסטיק", ["פלסטיק"])] },
    { key: "temperature", label: "בקרת טמפרטורה", options: [keywordOption("yes", "טמפרטורה משתנה", ["בורר טמפרטורה", "בקרת טמפרטורה", "דרגות חום"])] },
  ],
  blenders: [
    powerFacet,
    { key: "blender-type", label: "סוג בלנדר", options: [keywordOption("jug", "בלנדר שולחני", ["בלנדר שולחני", "כוס זכוכית", "כוס פלסטיק"]), keywordOption("personal", "שייקר אישי", ["שייקר", "בלנדר אישי"]), keywordOption("hand", "מוט / ידני", ["בלנדר מוט", "מוט טחינה"])] },
    { key: "jug", label: "חומר הכד", options: [keywordOption("glass", "זכוכית", ["כוס זכוכית", "כד זכוכית"]), keywordOption("plastic", "פלסטיק", ["כוס פלסטיק", "כד פלסטיק"])] },
  ],
  mixers: [
    powerFacet,
    { key: "mixer-type", label: "סוג מיקסר", options: [keywordOption("stand", "מיקסר עומד", ["מיקסר עומד"]), keywordOption("hand", "מיקסר ידני", ["מיקסר ידני"])] },
    { key: "bowl", label: "נפח קערה", options: [numericOption({ value: "up-to-5", label: "עד 5 ליטר", unitPattern: "ליטר|l", min: 1, max: 5, measurementMin: 1, measurementMax: 15, largest: true }), numericOption({ value: "5.1-7", label: "5.1–7 ליטר", unitPattern: "ליטר|l", min: 5.1, max: 7, measurementMin: 1, measurementMax: 15, largest: true }), numericOption({ value: "over-7", label: "מעל 7 ליטר", unitPattern: "ליטר|l", min: 7.1, max: 15, measurementMin: 1, measurementMax: 15, largest: true })] },
  ],
  "coffee-machines": [
    { key: "coffee-type", label: "סוג מכונה", options: [keywordOption("automatic", "אוטומטית", ["אוטומטית"]), keywordOption("capsule", "קפסולות", ["קפסולות", "נספרסו"]), keywordOption("espresso", "אספרסו ידנית", ["מכונת אספרסו"], "אספרסו", ["אוטומטית"]), keywordOption("filter", "פילטר", ["קפה פילטר"])] },
    { key: "grinder", label: "טחינה", options: [keywordOption("yes", "מטחנה מובנית", ["טוחן", "מטחנה פנימית", "מטחנת קפה"])] },
    { key: "milk", label: "חלב", options: [keywordOption("yes", "מקציף חלב", ["מקציף חלב", "הקצפת חלב", "צינורית קיטור"])] },
  ],
  fans: [
    { key: "fan-type", label: "סוג מאוורר", options: [keywordOption("ceiling", "תקרה", ["מאוורר תקרה", "מאוורר תקרתי"]), keywordOption("tower", "מגדל", ["מאוורר מגדל"]), keywordOption("standing", "עמוד / רצפתי", ["מאוורר עמוד", "מאוורר רצפתי"]), keywordOption("table", "שולחני", ["מאוורר שולחני"])] },
    { key: "light", label: "תאורה", options: [keywordOption("yes", "כולל תאורה", ["תאורת לד", "כולל תאורה", "led"])] },
    { key: "remote", label: "שליטה", options: [keywordOption("yes", "כולל שלט", ["שלט רחוק", "כולל שלט"])] },
  ],
  speakers: [
    { key: "speaker-type", label: "סוג רמקול", options: [keywordOption("party", "בידורית / קריוקי", ["בידורית", "קריוקי"]), keywordOption("portable", "נייד", ["רמקול נייד", "סוללה נטענת"]), keywordOption("home", "ביתי", ["רמקול ביתי", "מדפי"])] },
    { key: "microphones", label: "מיקרופונים", options: [keywordOption("yes", "כולל מיקרופונים", ["כולל מיקרופון", "מיקרופונים אלחוטיים", "2 מיקרופונים"])] },
    { key: "battery", label: "ניידות", options: [keywordOption("yes", "סוללה נטענת", ["סוללה נטענת", "זמן עבודה"])] },
  ],
  "hair-clippers": [
    {
      key: "grooming-type",
      label: "ייעוד",
      options: [
        keywordOption("multigroom", "ערכת טיפוח רב־שימושית", ["ערכת טיפוח", "רב תכליתית", "ב 1", "all in one"]),
        keywordOption("hair", "תספורת שיער", ["מכונת תספורת", "מסרקי שיער"]),
        keywordOption("beard", "זקן וקווי מתאר", ["עיצוב זקן", "קווי זקן", "טרימר", "פיניש"]),
        keywordOption("nose-ears", "אף ואוזניים", ["אף ואוזניים", "שיער אף", "נחיריים"]),
      ],
    },
    {
      key: "power-source",
      label: "אופן הפעלה",
      options: [
        keywordOption("rechargeable", "נטענת / אלחוטית", ["נטענת", "אלחוטי", "סוללת ליתיום"]),
        keywordOption("corded", "אפשרות עבודה בחיבור לחשמל", ["כבל חשמל", "שימוש עם כבל", "חיבור ישיר לחשמל"]),
        keywordOption("battery", "סוללות רגילות", ["סוללת aa", "סוללות aa", "סוללה רגילה"]),
      ],
    },
    { key: "waterproof", label: "ניקוי ושימוש", options: [keywordOption("yes", "עמידה במים / נשטפת", ["עמיד למים", "עמידה במים", "שטיפה תחת הברז", "wet dry"])] },
  ],
  shavers: [
    {
      key: "shaver-head",
      label: "סוג ראש",
      options: [
        keywordOption("foil", "רשת", ["ראש רשת", "מכונת גילוח רשת", "foil"]),
        keywordOption("rotary", "ראשים סיבוביים", ["ראש סיבובי", "ראשים סיבוביים", "rotary"]),
        keywordOption("grooming-kit", "ערכת טיפוח", ["ערכת טיפוח", "טרימר"]),
      ],
    },
    { key: "wet-dry", label: "אופן שימוש", options: [keywordOption("yes", "רטוב ויבש", ["רטוב ויבש", "wet dry", "לשימוש במקלחת"])] },
    { key: "rechargeable", label: "מקור מתח", options: [keywordOption("yes", "נטענת / אלחוטית", ["נטענת", "אלחוטי", "סוללת ליתיום"])] },
  ],
  phones: [
    {
      key: "phone-type",
      label: "סוג מכשיר",
      options: [
        keywordOption("corded", "טלפון חוטי", ["טלפון ביתי חוטי", "טלפון חוטי"]),
        keywordOption("cordless", "טלפון אלחוטי", ["טלפון אלחוטי", "טלפון ביתי אלחוטי", "dect"]),
        keywordOption("baby-monitor", "אינטרקום לתינוק", ["אינטרקום לתינוק", "יחידת הורה"]),
      ],
    },
    { key: "answering-machine", label: "מענה קולי", options: [keywordOption("yes", "משיבון מובנה", ["משיבון", "מענה קולי"])] },
    { key: "speakerphone", label: "נוחות שיחה", options: [keywordOption("yes", "דיבורית", ["דיבורית", "speakerphone"])] },
  ],
  "hot-plates": [
    {
      key: "hotplate-type",
      label: "סוג חימום",
      options: [
        keywordOption("gas", "גז", ["כירת גז", "מבער גז"]),
        keywordOption("ceramic", "קרמי / אינפרא אדום", ["קרמי", "קרמית", "קרמיות", "אינפרא אדום"]),
        keywordOption("cast-iron", "פלטות מתכת", ["ראשי מתכת", "פלטות יציקה"]),
      ],
    },
    {
      key: "burners",
      label: "מספר מוקדי בישול",
      options: [1, 2, 3].map((burners) => ({
        value: String(burners),
        label: `${burners} מוקדים / להבות`,
        query: `${burners} להבות`,
        queryTerms: [`${burners} להבות`, `${burners} פלטות`, ...(burners === 1 ? ["בודדה"] : burners === 2 ? ["זוגית"] : [])],
        matches: ({ text }) => new RegExp(`(^|\\s)${burners}\\s*(?:להבות|מבערימ|פלטות|גופי חימומ)`).test(text) || (burners === 1 ? text.includes("בודדה") : burners === 2 && text.includes("זוגית")),
      })),
    },
    powerFacet,
  ],
  "shabbat-hot-plates": [
    {
      key: "pot-capacity",
      label: "קיבולת סירים",
      options: exactMeasurementOptions([2, 4, 6], "סירים", (value) => `${value} סירים`, (value) => `${value} סירים`, 1, 8),
    },
    { key: "folding", label: "מבנה", options: [keywordOption("yes", "מתקפלת", ["מתקפלת", "מתקפל", "סיליקון"])] },
    { key: "shabbat-approval", label: "אישור לשבת", options: [keywordOption("yes", "עם אישור הלכתי", ["מאושרת לשימוש בשבת", "מאושר לשימוש בשבת", "אישור הלכתי", "מכון צמת", "משמרת השבת"])] },
    powerFacet,
  ],
  humidifiers: [
    {
      key: "urn-capacity",
      label: "קיבולת",
      options: [
        numericOption({ value: "up-to-30", label: "עד 30 כוסות", unitPattern: "כוסות", min: 1, max: 30, measurementMin: 1, measurementMax: 100 }),
        numericOption({ value: "31-50", label: "31–50 כוסות", unitPattern: "כוסות", min: 31, max: 50, measurementMin: 1, measurementMax: 100 }),
        numericOption({ value: "over-50", label: "מעל 50 כוסות", unitPattern: "כוסות", min: 51, max: 100, measurementMin: 1, measurementMax: 100 }),
      ],
    },
    { key: "shabbat-approval", label: "התאמה לשבת", options: [keywordOption("yes", "מצב / אישור שבת", ["מצב שבת", "מאושר לשימוש בשבת", "אישור הלכתי", "משמרת השבת"])] },
    { key: "safety", label: "בטיחות", options: [keywordOption("dry-protection", "הגנה בהיעדר מים", ["הגנה מפני שימוש ללא מים", "הגנה בפני הפעלה ללא מים", "חוסר במים", "ייבוש"])] },
    powerFacet,
  ],
  "food-processors": [
    powerFacet,
    {
      key: "bowl-capacity",
      label: "נפח קערה",
      options: [
        numericOption({ value: "up-to-3", label: "עד 3 ליטר", unitPattern: "ליטר|l", min: 1, max: 3, measurementMin: 1, measurementMax: 8, largest: true }),
        numericOption({ value: "over-3", label: "מעל 3 ליטר", unitPattern: "ליטר|l", min: 3.1, max: 8, measurementMin: 1, measurementMax: 8, largest: true }),
      ],
    },
    { key: "dicing", label: "אביזרים ופעולות", options: [keywordOption("yes", "חיתוך לקוביות", ["חיתוך לקוביות", "קוביות", "dicing"]), keywordOption("dough", "לישת בצק", ["לישת בצק", "להב לישה"])] },
  ],
  radios: [
    {
      key: "radio-type",
      label: "סוג רדיו",
      options: [
        keywordOption("portable", "נייד", ["רדיו נייד", "ניידות", "ידית נשיאה"]),
        keywordOption("alarm", "רדיו שעון מעורר", ["שעון מעורר", "alarm", "snooze"]),
        keywordOption("emergency", "רדיו חירום", ["רדיו חירום", "דינמו", "סולארי", "sos"]),
      ],
    },
    { key: "bluetooth", label: "קישוריות", options: [keywordOption("yes", "Bluetooth", ["bluetooth", "בלוטוס"]), keywordOption("usb", "USB / כרטיס זיכרון", ["usb", "כרטיס sd", "כרטיסי זיכרון"])] },
    { key: "cd", label: "מדיה", options: [keywordOption("yes", "CD / DVD", ["cd", "dvd", "תקליטורים"])] },
  ],
  "steam-cleaners": [
    powerFacet,
    { key: "vacuum-combo", label: "שיטת ניקוי", options: [keywordOption("yes", "שאיבה, שטיפה וקיטור", ["שאיבה שטיפה וקיטור", "שואבת ושוטפת", "hydrosteam"])] },
    { key: "surfaces", label: "ייעוד", options: [keywordOption("upholstery", "ריפודים", ["ריפודים", "ספות"]), keywordOption("windows", "חלונות", ["חלונות", "מגב חלונות"])] },
  ],
  irons: [
    powerFacet,
    { key: "iron-type", label: "סוג מגהץ", options: [keywordOption("station", "תחנת קיטור", ["תחנת קיטור", "מחולל קיטור"]), keywordOption("steam", "מגהץ אדים", ["מגהץ אדים", "מגהץ קיטור"]), keywordOption("vertical", "אנכי", ["מגהץ אנכי", "אדים אנכי"])] },
  ],
  toasters: [
    { key: "slices", label: "מספר פרוסות", options: [2, 4].map((slices) => ({ value: String(slices), label: `${slices} פרוסות`, query: `${slices} פרוסות`, queryTerms: [`${slices} פרוסות`], matches: ({ text }) => new RegExp(`(^|\\s)${slices}\\s*פרוסות`).test(text) })) },
  ],
  "range-hoods": [widthFacet, { key: "hood-type", label: "סוג קולט", options: [keywordOption("chimney", "ארובה", ["ארובה"]), keywordOption("built-in", "אינטגרלי / נסתר", ["אינטגרלי", "נסתר", "בילט אין"]), keywordOption("wall", "צמוד קיר", ["צמוד קיר"])] }],
  "wine-coolers": [
    { key: "bottles", label: "קיבולת בקבוקים", options: [numericOption({ value: "up-to-12", label: "עד 12 בקבוקים", unitPattern: "בקבוקים", min: 1, max: 12, measurementMin: 1, measurementMax: 200 }), numericOption({ value: "13-30", label: "13–30 בקבוקים", unitPattern: "בקבוקים", min: 13, max: 30, measurementMin: 1, measurementMax: 200 }), numericOption({ value: "over-30", label: "מעל 30 בקבוקים", unitPattern: "בקבוקים", min: 31, max: 200, measurementMin: 1, measurementMax: 200 })] },
    { key: "zones", label: "אזורי טמפרטורה", options: [keywordOption("dual", "שני אזורי טמפרטורה", ["2 אזורי טמפרטורה", "dual zone", "אזור כפול"])] },
  ],
  "air-fryers": [
    powerFacet,
    { key: "capacity", label: "נפח", options: [numericOption({ value: "up-to-5", label: "עד 5 ליטר", unitPattern: "ליטר|l", min: 1, max: 5, measurementMin: 1, measurementMax: 20, largest: true }), numericOption({ value: "5.1-8", label: "5.1–8 ליטר", unitPattern: "ליטר|l", min: 5.1, max: 8, measurementMin: 1, measurementMax: 20, largest: true }), numericOption({ value: "over-8", label: "מעל 8 ליטר", unitPattern: "ליטר|l", min: 8.1, max: 20, measurementMin: 1, measurementMax: 20, largest: true })] },
    { key: "air-fryer-type", label: "מבנה", options: [keywordOption("dual", "שני תאים", ["שני תאים", "2 תאים", "dual zone"]), keywordOption("glass", "קערת זכוכית", ["קערת זכוכית"])] },
  ],
};

const POWER_CATEGORIES = new Set([
  "blenders", "mixers", "irons", "air-fryers", "food-processors", "meat-grinders", "juicers", "hair-dryers",
  "toaster-ovens", "deep-fryers", "heaters", "space-heaters", "electric-grills", "coffee-grinders", "panini-grills",
]);

function definitionsForCategory(categorySlug: string): FacetDefinition[] {
  const definitions = [...(CATEGORY_DEFINITIONS[categorySlug] ?? [])];
  if (POWER_CATEGORIES.has(categorySlug) && !definitions.some((definition) => definition.key === powerFacet.key)) {
    definitions.push(powerFacet);
  }
  if (!definitions.some((definition) => definition.key === colorFacet.key)) definitions.push(colorFacet);
  return definitions;
}

function contextFor(product: Product): FacetContext {
  const cached = facetContextCache.get(product);
  if (cached) return cached;
  const precomputed = (product as Product & { searchBlob?: string }).searchBlob;
  const text = precomputed || normalizeHebrewSearch([
    product.name,
    product.brand,
    product.category,
    product.modelNumber,
    product.description,
    ...product.capabilities,
    ...product.specs.flatMap((spec) => [spec.label, spec.value]),
  ].filter(Boolean).join(" "));
  const context = { product, text, name: normalizeHebrewSearch(product.name) };
  facetContextCache.set(product, context);
  return context;
}

function findDefinition(categorySlug: string | null, key: string): FacetDefinition | undefined {
  if (!categorySlug) return undefined;
  return definitionsForCategory(categorySlug).find((definition) => definition.key === key);
}

export function facetParamKey(key: string): string {
  return `${FACET_PARAM_PREFIX}${key}`;
}

export function parseFacetSelections(params: Record<string, string | string[] | undefined>): FacetSelections {
  const selections: FacetSelections = {};
  for (const [param, raw] of Object.entries(params)) {
    if (!param.startsWith(FACET_PARAM_PREFIX)) continue;
    const key = param.slice(FACET_PARAM_PREFIX.length);
    if (!/^[a-z0-9-]{1,40}$/.test(key)) continue;
    const values = (Array.isArray(raw) ? raw : [raw])
      .flatMap((value) => value?.split(",") ?? [])
      .map((value) => value.trim())
      .filter((value) => /^[a-z0-9.-]{1,40}$/.test(value))
      .slice(0, 8);
    if (values.length > 0) selections[key] = Array.from(new Set(values));
  }
  return selections;
}

export function filterProductsByFacets(products: Product[], selections: FacetSelections): Product[] {
  const active = Object.entries(selections).filter(([, values]) => values.length > 0);
  if (active.length === 0) return products;

  return products.filter((product) => {
    const context = contextFor(product);
    return active.every(([key, values]) => {
      const definition = findDefinition(product.categorySlug, key);
      if (!definition) return false;
      return values.some((value) => definition.options.find((option) => option.value === value)?.matches(context));
    });
  });
}

export function buildProductFacets(
  products: Product[],
  categorySlug: string,
  selections: FacetSelections = {}
): ProductFacetGroup[] {
  const categoryProducts = products.filter((product) => product.categorySlug === categorySlug);
  if (categoryProducts.length === 0) return [];
  const minimumMatches = categoryProducts.length >= 8 ? 2 : 1;

  return definitionsForCategory(categorySlug).flatMap((definition) => {
    const otherSelections = Object.fromEntries(
      Object.entries(selections).filter(([key]) => key !== definition.key)
    );
    const baseProducts = filterProductsByFacets(categoryProducts, otherSelections);
    const selectedValues = new Set(selections[definition.key] ?? []);
    const options = definition.options
      .map((option) => ({
        value: option.value,
        label: option.label,
        query: option.query,
        count: baseProducts.filter((product) => option.matches(contextFor(product))).length,
      }))
      .filter((option) => option.count >= minimumMatches || selectedValues.has(option.value))
      .slice(0, definition.maxOptions ?? 8);

    const dividesCatalog = options.some((option) => option.count > 0 && option.count < baseProducts.length);
    if (options.length === 0 || (!dividesCatalog && options.length < 2)) return [];
    return [{ key: definition.key, label: definition.label, options }];
  });
}

export function inferFacetSelectionsFromQuery(query: string, categorySlug?: string): FacetSelections {
  const text = normalizeHebrewSearch(query);
  if (!text) return {};
  const definitions = categorySlug
    ? definitionsForCategory(categorySlug)
    : Object.keys(CATEGORY_DEFINITIONS).flatMap(definitionsForCategory);
  const selections: FacetSelections = {};

  for (const definition of definitions) {
    const values = definition.options
      .filter((option) => normalizedTerms(option.queryTerms).some((term) => term.length >= 2 && containsPhrase(text, term)))
      .map((option) => option.value);
    if (values.length > 0) {
      selections[definition.key] = Array.from(new Set([...(selections[definition.key] ?? []), ...values]));
    }
  }
  return selections;
}

export function mergeFacetSelections(primary: FacetSelections, inferred: FacetSelections): FacetSelections {
  const merged: FacetSelections = { ...inferred };
  for (const [key, values] of Object.entries(primary)) merged[key] = values;
  return merged;
}

export function facetOptionLabel(facets: ProductFacetGroup[], key: string, value: string): string {
  const facet = facets.find((group) => group.key === key);
  if (!facet) return value;
  const option = facet.options.find((candidate) => candidate.value === value);
  return option ? `${facet.label}: ${option.label}` : value;
}
