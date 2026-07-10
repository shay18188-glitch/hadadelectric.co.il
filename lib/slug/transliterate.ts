/**
 * Converts Hebrew (and mixed) text into ASCII slug-safe Latin.
 * Used as a fallback when a category/brand has no explicit English slug.
 */

const HEBREW_TO_LATIN: Record<string, string> = {
  א: "a",
  ב: "b",
  ג: "g",
  ד: "d",
  ה: "h",
  ו: "v",
  ז: "z",
  ח: "ch",
  ט: "t",
  י: "y",
  כ: "k",
  ך: "k",
  ל: "l",
  מ: "m",
  ם: "m",
  נ: "n",
  ן: "n",
  ס: "s",
  ע: "a",
  פ: "p",
  ף: "p",
  צ: "tz",
  ץ: "tz",
  ק: "k",
  ר: "r",
  ש: "sh",
  ת: "t",
};

export function transliterateToLatin(input: string): string {
  let output = "";
  for (const char of input.normalize("NFKC")) {
    if (HEBREW_TO_LATIN[char]) {
      output += HEBREW_TO_LATIN[char];
      continue;
    }
    output += char;
  }
  return output;
}
