/**
 * Single source of truth for how brand names are written on SEO surfaces
 * (titles, meta descriptions, structured data, headings).
 *
 * Three deliberate rules:
 *
 * 1. Display casing is normalized ("BOSCH" -> "Bosch"). This is slug-safe:
 *    `generateBrandSlug()` lowercases, so no live URL moves.
 * 2. Supplier *spelling* is left alone. "Hemilton" and "Sol exlusive" are
 *    misspellings, but the brand slug is derived from them — renaming would
 *    move `/brands/hemilton` and break inbound links. Corrections belong in
 *    the supplier feed, not here.
 * 3. Localized aliases exist so that a Hebrew query ("מכונת כביסה סמסונג")
 *    or a Russian one can still match a page whose title carries only the
 *    Latin brand. They feed meta descriptions and schema `alternateName`,
 *    never the title — a title has no room to spend on a second spelling.
 */

/** Raw supplier value (lowercased) -> the casing we publish. */
const BRAND_DISPLAY: Record<string, string> = {
  bosch: "Bosch",
  maxwell: "Maxwell",
  lexus: "Lexus",
  silverline: "Silverline",
  steel: "Steel",
  gamma: "Gamma",
  davo: "Davo",
  dome: "Dome",
  star: "Star",
  king: "King",
  carbon: "Carbon",
  topson: "Topson",
  omega: "Omega",
  carrera: "Carrera",
  service: "Service",
  hciq: "HCIQ",
  turboair: "TurboAir",
  jonr: "JONR",
  taiyo: "Taiyo",
  "morphy richards": "Morphy Richards",
  "packard bell": "Packard Bell",
  "russel hobbs": "Russel Hobbs",
  "pure acoustics": "Pure Acoustics",
  "gold line": "Gold Line",
  "black+decker": "Black+Decker",
  delonghi: "De'Longhi",
  kitchenaid: "KitchenAid",
  proview: "ProView",
  uwant: "UWANT",
  aeg: "AEG",
  tcl: "TCL",
  lg: "LG",
  "s.a.p": "S.A.P",
  dlx: "DLX",
  mag: "MAG",
};

/** Hebrew spellings people actually type. Used in copy and `alternateName`. */
const BRAND_HE: Record<string, string[]> = {
  samsung: ["סמסונג"],
  lg: ["אל ג'י"],
  bosch: ["בוש"],
  electrolux: ["אלקטרולוקס"],
  sharp: ["שארפ"],
  hisense: ["הייסנס"],
  midea: ["מידאה"],
  haier: ["האייר"],
  electra: ["אלקטרה"],
  tadiran: ["תדיראן"],
  tornado: ["טורנדו"],
  dreame: ["דרימי"],
  dyson: ["דייסון"],
  roborock: ["רובורוק"],
  tcl: ["טי סי אל"],
  beko: ["בקו"],
  siemens: ["סימנס"],
  panasonic: ["פנסוניק"],
  philips: ["פיליפס"],
  ninja: ["נינג'ה", "נינגה"],
  delonghi: ["דלונגי"],
  gorenje: ["גורניה"],
  zanussi: ["זנוסי"],
  candy: ["קנדי"],
  toshiba: ["טושיבה"],
  hyundai: ["יונדאי"],
  xiaomi: ["שיאומי"],
  braun: ["בראון"],
  tefal: ["טפאל"],
  moulinex: ["מולינקס"],
  kenwood: ["קנווד"],
  sauter: ["סאוטר"],
  normande: ["נורמנדה"],
  crystal: ["קריסטל"],
  grundig: ["גרונדיג"],
  whirlpool: ["וירלפול"],
  teka: ["טקה"],
  shark: ["שארק"],
  bissell: ["ביסל"],
  remington: ["רמינגטון"],
  babyliss: ["בייבליס"],
  anker: ["אנקר"],
  breville: ["ברוויל"],
  cuisinart: ["קוזינרט"],
  "black+decker": ["בלק אנד דקר"],
  aiwa: ["אייווה"],
  konka: ["קונקה"],
  premier: ["פרימיר"],
  luxor: ["לוקסור"],
  westinghouse: ["וסטינגהאוס"],
  lofra: ["לופרה"],
  polk: ["פולק"],
};

/** Cyrillic spellings for the brands that are commonly written that way. */
const BRAND_RU: Record<string, string[]> = {
  samsung: ["Самсунг"],
  lg: ["Эл Джи"],
  bosch: ["Бош"],
  electrolux: ["Электролюкс"],
  sharp: ["Шарп"],
  hisense: ["Хайсенс"],
  midea: ["Мидея"],
  haier: ["Хайер"],
  siemens: ["Сименс"],
  philips: ["Филипс"],
  panasonic: ["Панасоник"],
  beko: ["Беко"],
  gorenje: ["Горенье"],
  zanussi: ["Занусси"],
  candy: ["Канди"],
  toshiba: ["Тошиба"],
  xiaomi: ["Сяоми"],
  braun: ["Браун"],
  tefal: ["Тефаль"],
  moulinex: ["Мулинекс"],
  dyson: ["Дайсон"],
  delonghi: ["Делонги"],
  electra: ["Электра"],
  tadiran: ["Тадиран"],
};

function key(brand: string): string {
  return brand.trim().toLowerCase();
}

/**
 * The brand name as it should appear to a reader or a crawler.
 * Falls back to the supplier value with its original casing.
 */
export function seoBrandName(brand: string | null | undefined): string | null {
  const raw = brand?.trim();
  if (!raw) return null;
  return BRAND_DISPLAY[key(raw)] ?? raw;
}

/** Localized spellings of a brand, for body copy and `alternateName`. */
export function brandAliases(brand: string | null | undefined, locale: "he" | "en" | "ru"): string[] {
  const raw = brand?.trim();
  if (!raw) return [];
  if (locale === "he") return BRAND_HE[key(raw)] ?? [];
  if (locale === "ru") return BRAND_RU[key(raw)] ?? [];
  return [];
}

/** Every spelling of a brand we know about — used for schema `alternateName`. */
export function allBrandAliases(brand: string | null | undefined): string[] {
  const raw = brand?.trim();
  if (!raw) return [];
  const display = seoBrandName(raw);
  const all = [raw, ...(BRAND_HE[key(raw)] ?? []), ...(BRAND_RU[key(raw)] ?? [])];
  return Array.from(new Set(all.filter((name) => name && name !== display))) as string[];
}
