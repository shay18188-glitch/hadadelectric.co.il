/**
 * Normalizes free-text search input for Hebrew + mixed Hebrew/English/model-number queries.
 * - Converts Hebrew final letters to their regular form (ך→כ, ם→מ, ן→נ, ף→פ, ץ→צ)
 *   so "מקרר" style typos with wrong final letters still match.
 * - Collapses whitespace/punctuation.
 * - Lowercases Latin characters (model numbers, brand names).
 */
const FINAL_LETTERS: Record<string, string> = {
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
};

export function normalizeHebrewSearch(text: string): string {
  if (!text) return "";

  let result = text.toLowerCase().trim();
  result = result.replace(/[ךםןףץ]/g, (letter) => FINAL_LETTERS[letter] ?? letter);
  result = result.replace(/["'׳״.,\-_/\\]+/g, " ");
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

/**
 * Synonym groups: searching for any term in a group should also match
 * products containing other terms from the same group.
 */
export const SEARCH_SYNONYMS: string[][] = [
  ["מקרר", "מקררים", "מקפיא", "מקפיאים", "קירור", "fridge"],
  ["מכונת כביסה", "מכונות כביסה", "כביסה", "washer"],
  ["מייבש", "מייבש כביסה", "מייבשי כביסה", "dryer"],
  ["מדיח", "מדיח כלים", "מדיחי כלים", "dishwasher"],
  ["תנור", "תנורים", "אפייה", "oven"],
  ["כיריים", "גז", "אינדוקציה", "cooktop"],
  ["טלוויזיה", "טלוויזיות", "מסך", "tv", "television"],
  ["מזגן", "מזגנים", "מיזוג", "ac", "air conditioner"],
  ["מיקרוגל", "מיקרו"],
  ["קולט", "קולט אדים", "קולטי אדים"],
];

export function expandWithSynonyms(query: string): string[] {
  const normalized = normalizeHebrewSearch(query);
  const terms = new Set<string>([normalized]);

  for (const group of SEARCH_SYNONYMS) {
    const normalizedGroup = group.map(normalizeHebrewSearch);
    if (normalizedGroup.some((term) => normalized.includes(term) || term.includes(normalized))) {
      normalizedGroup.forEach((term) => terms.add(term));
    }
  }

  return Array.from(terms);
}
