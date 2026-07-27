/**
 * Normalizes Hebrew and mixed Hebrew/English catalog searches. Besides
 * punctuation/final letters, this fixes the most common shopper spellings so
 * queries such as "טלויזה 50 אינצ" behave like "טלוויזיה 50 אינץ".
 */
const FINAL_LETTERS: Record<string, string> = {
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
};

const COMMON_SPELLINGS: Record<string, string> = {
  "טלויזה": "טלוויזיה",
  "טלויזיה": "טלוויזיה",
  "טלביזיה": "טלוויזיה",
  "טלויזות": "טלוויזיות",
  "טלביזיות": "טלוויזיות",
  "אינצ": "אינצ",
  "אינטש": "אינצ",
  "אינצימ": "אינצ",
  "קילו": "קג",
  "קילוגרמ": "קג",
  "ארבע": "4",
  "ארבעה": "4",
  "שלוש": "3",
  "שלושה": "3",
  "שתי": "2",
  "שני": "2",
};

function normalizeBase(text: string): string {
  let result = text.toLowerCase().trim();
  result = result.replace(/[\u0591-\u05c7]/g, "");
  result = result.replace(/[ךםןףץ]/g, (letter) => FINAL_LETTERS[letter] ?? letter);
  // Keep common Hebrew measurement abbreviations as one searchable token
  // before quote punctuation is stripped (ק״ג → קג, ס״מ → סמ, כ״ס → כס).
  result = result
    .replace(/ק\s*["'׳״]\s*ג/g, "קג")
    .replace(/ס\s*["'׳״]\s*מ/g, "סמ")
    .replace(/מ\s*["'׳״]\s*מ/g, "ממ")
    .replace(/כ\s*["'׳״]\s*ס/g, "כס");
  // Keep decimal measurements searchable (1.5 כ״ס) and collapse thousands
  // separators (12,000Pa → 12000pa) before general punctuation is removed.
  result = result
    .replace(/(\d)[,.](?=\d{3}(?:\D|$))/g, "$1")
    .replace(/(\d)[,.](\d)/g, "$1¤$2");
  // Catalog titles commonly express TV sizes as 50' or 65". Preserve the
  // unit before punctuation is removed so a size is not confused with Hz,
  // dimensions or a model number elsewhere in the product specification.
  result = result.replace(/(\d+(?:\.\d+)?)\s*["'׳״]/g, "$1 אינצ ");
  result = result.replace(/["'׳״.,\-_/\\]+/g, " ");
  return result.replace(/¤/g, ".").replace(/\s+/g, " ").trim();
}

export function normalizeHebrewSearch(text: string): string {
  if (!text) return "";
  return normalizeBase(text)
    .split(" ")
    .map((token) => COMMON_SPELLINGS[token] ?? token)
    .join(" ");
}

/** Synonym groups used by product, category and autocomplete search. */
export const SEARCH_SYNONYMS: string[][] = [
  ["מקרר", "מקררים", "קירור", "fridge"],
  ["מקפיא", "מקפיאים", "freezer"],
  ["מכונת כביסה", "מכונות כביסה", "כביסה", "washer"],
  ["מייבש", "מייבש כביסה", "מייבשי כביסה", "dryer"],
  ["מדיח", "מדיח כלים", "מדיחי כלים", "dishwasher"],
  ["תנור", "תנורים", "אפייה", "oven"],
  ["כיריים", "כירה", "כירות", "אינדוקציה", "cooktop"],
  ["טלוויזיה", "טלוויזיות", "מסכ", "tv", "television"],
  ["מזגנ", "מזגנים", "מיזוג", "ac", "air conditioner"],
  ["מיקרוגל", "מיקרו"],
  ["קולט", "קולט אדים", "קולטי אדים"],
  ["שואב רובוטי", "שואב רובוט", "רובורוק", "robot vacuum"],
  ["שומר שבת", "מצב שבת", "פיקוד שבת", "תוכנית שבת", "שבת וחג"],
  ["מקפיא תחתון", "פריזר תחתון", "bottom freezer"],
  ["מקפיא עליון", "פריזר עליון", "top freezer"],
  ["4 דלתות", "ארבע דלתות", "ארבעה דלתות"],
  ["no frost", "נו פרוסט", "ללא הצטברות קרח"],
  ["פירוליטי", "ניקוי פירוליטי", "פירוליזה"],
  ["heat pump", "היט פאמפ", "משאבת חום"],
  ["קונדנסור", "מעבה", "condenser"],
  ["אינטגרלי מלא", "בילט אין מלא", "fully integrated"],
  ["אינוורטר", "inverter"],
  ["קיטור", "steam", "אדים"],
];

/** Words that describe the request but should not be required in every result. */
export const SEARCH_STOP_WORDS = new Set([
  "אני",
  "רוצה",
  "מחפש",
  "מחפשת",
  "צריך",
  "צריכה",
  "עם",
  "בלי",
  "של",
  "בצבע",
  "צבע",
  "בעל",
  "בעלת",
  "כולל",
  "שיהיה",
  "שומר",
  "מומלץ",
  "מומלצת",
].map(normalizeHebrewSearch));

/**
 * Expands only the category phrase while preserving intent modifiers. Thus
 * "טלויזה 50 אינצ" also searches "מסכ 50 אינצ", not the
 * overly broad "מסכ" by itself.
 */
export function expandWithSynonyms(query: string): string[] {
  const normalized = normalizeHebrewSearch(query);
  const terms = new Set<string>([normalized]);

  for (const group of SEARCH_SYNONYMS) {
    const normalizedGroup = group.map(normalizeHebrewSearch).sort((a, b) => b.length - a.length);
    const matched = normalizedGroup.find((term) => normalized.includes(term) || term === normalized);
    if (!matched) continue;
    for (const synonym of normalizedGroup) {
      terms.add(normalized.replace(matched, synonym).replace(/\s+/g, " ").trim());
    }
  }

  return Array.from(terms).filter(Boolean);
}
