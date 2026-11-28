/**
 * Low-level, dependency-free matching helpers for the catalog search engine:
 * edit distance, Hebrew morphology, sound-alike keys that work across Hebrew
 * and Latin letters (so "נינגה" meets "ninja"), and keyboard-layout repair
 * ("nerr" typed on an English layout is "מקרר").
 *
 * Every function expects text that already went through
 * `normalizeHebrewSearch` (lower case, final letters folded, no geresh).
 */

const HEBREW_LETTER = /[א-ת]/;
const LATIN_LETTER = /[a-z]/;

export function isHebrewToken(token: string): boolean {
  return HEBREW_LETTER.test(token) && !LATIN_LETTER.test(token);
}

export function isLatinToken(token: string): boolean {
  return LATIN_LETTER.test(token) && !HEBREW_LETTER.test(token);
}

export function hasDigit(token: string): boolean {
  return /\d/.test(token);
}

/**
 * Optimal-string-alignment Damerau–Levenshtein distance with an early exit
 * once the distance is known to exceed `max`. Transpositions ("מקררר",
 * "samsnug") count as one edit, which is how people actually mistype.
 */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  if (la === 0) return lb;
  if (lb === 0) return la;

  let prevPrev = new Array<number>(lb + 1).fill(0);
  let prev = new Array<number>(lb + 1);
  let curr = new Array<number>(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, prevPrev[j - 2] + 1);
      }
      curr[j] = value;
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return max + 1;
    [prevPrev, prev, curr] = [prev, curr, prevPrev];
  }
  return prev[lb];
}

/** How many typos a token of this length may carry and still match. */
export function allowedTypos(length: number): number {
  if (length >= 8) return 2;
  if (length >= 4) return 1;
  return 0;
}

const HEBREW_PREFIXES = ["וה", "שה", "בה", "לה", "מה", "כש", "ו", "ה", "ב", "ל", "מ", "ש", "כ"];
// Normalized text has final letters folded, so the plural "ים" is "ימ".
const HEBREW_SUFFIXES = ["יות", "ימ", "ות", "יה", "ית", "ה", "י"];

/**
 * Plausible stems of a Hebrew token: the token without a one/two-letter
 * prefix (ו/ה/ב/ל/מ/ש/כ) and/or a plural or feminine ending. A prefix is
 * only removed when four letters remain and an ending when three remain, so
 * "מקררים" → "מקרר" and "למקרר" → "מקרר", but short words are never chopped
 * into noise.
 */
const CYRILLIC_ENDINGS = ["ами", "ями", "ого", "его", "ому", "ему", "ыми", "ими", "ов", "ев", "ей", "ой", "ый", "ий", "ая", "яя", "ое", "ее", "ые", "ие", "ую", "юю", "ах", "ях", "ам", "ям", "ом", "ем", "а", "я", "ы", "и", "е", "у", "ю", "о"];

/** Russian inflections folded to a shared stem: "телевизора" ↔ "телевизор". */
function cyrillicStems(token: string): string[] {
  if (!/^[\u0430-\u044f]+$/.test(token) || token.length < 5) return [];
  for (const ending of CYRILLIC_ENDINGS) {
    if (token.endsWith(ending) && token.length - ending.length >= 4) return [token.slice(0, -ending.length)];
  }
  return [];
}

export function hebrewStems(token: string): string[] {
  if (/[\u0430-\u044f]/.test(token)) return cyrillicStems(token);
  if (!isHebrewToken(token) || token.length < 4) return [];
  const out = new Set<string>();
  const bases = [token];
  for (const prefix of HEBREW_PREFIXES) {
    // Four letters must remain: "למקרר" → "מקרר", but "מקרר" never → "קרר".
    if (token.startsWith(prefix) && token.length - prefix.length >= 4) {
      bases.push(token.slice(prefix.length));
    }
  }
  for (const base of bases) {
    if (base !== token) out.add(base);
    for (const suffix of HEBREW_SUFFIXES) {
      if (base.endsWith(suffix) && base.length - suffix.length >= 3) {
        out.add(base.slice(0, -suffix.length));
      }
    }
  }
  out.delete(token);
  return Array.from(out);
}

/**
 * Hebrew spelling skeleton: drops the letters Hebrew writers add or omit
 * freely (א ה ו י ע inside a word) and folds letters that sound the same
 * (ק/כ, ט/ת, ח/כ, ש/ס). "טלויזיה", "טלוויזיה" and "טלביזיה" all collapse to
 * the same skeleton; so do "מיקרוגל" and "מקרוגל".
 */
export function hebrewSkeleton(token: string): string {
  if (!isHebrewToken(token)) return token;
  let out = "";
  for (let i = 0; i < token.length; i++) {
    let ch = token[i];
    if (ch === "ק" || ch === "ח") ch = "כ";
    else if (ch === "ט") ch = "ת";
    else if (ch === "ש") ch = "ס";
    else if (ch === "ב") ch = "ו";
    if (i > 0 && (ch === "א" || ch === "ה" || ch === "ו" || ch === "י" || ch === "ע")) continue;
    out += ch;
  }
  return out;
}

const HEBREW_TO_SOUND: Record<string, string> = {
  א: "",
  ב: "b",
  ג: "g",
  ד: "d",
  ה: "",
  ו: "",
  ז: "s",
  ח: "k",
  ט: "t",
  י: "",
  כ: "k",
  ל: "l",
  מ: "m",
  נ: "n",
  ס: "s",
  ע: "",
  פ: "p",
  צ: "ts",
  ק: "k",
  ר: "r",
  ש: "s",
  ת: "t",
};

/**
 * Consonant sound key shared by Hebrew and Latin spellings of the same
 * word. Vowels (and Hebrew vowel letters) are dropped and confusable sounds
 * are folded, so "samsung" and "סמסונג" are both "smsng", "ninja" and
 * "נינגה" are both "nng", "kitchenaid" and "קיטשנאייד" are both "ktsnd".
 * Returns "" for tokens that carry digits (model numbers are matched
 * separately) or too little signal.
 */
export function soundKey(token: string): string {
  if (!token || hasDigit(token)) return "";
  if (isHebrewToken(token)) {
    let out = "";
    for (let i = 0; i < token.length; i++) {
      const ch = token[i];
      // "וו" is the consonant V; a single ו is a vowel letter.
      if (ch === "ו" && token[i + 1] === "ו") {
        out += "v";
        i++;
        continue;
      }
      out += HEBREW_TO_SOUND[ch] ?? "";
    }
    return out.replace(/(.)\1+/g, "$1");
  }
  if (isLatinToken(token)) {
    const out = token
      .replace(/[^a-z]/g, "")
      .replace(/tch/g, "ts")
      .replace(/sch/g, "s")
      .replace(/ch/g, "ts")
      .replace(/sh/g, "s")
      .replace(/ph/g, "p")
      .replace(/th/g, "t")
      .replace(/ck/g, "k")
      .replace(/tz/g, "ts")
      .replace(/x/g, "ks")
      .replace(/qu/g, "kv")
      .replace(/[cq]/g, "k")
      .replace(/w/g, "v")
      .replace(/z/g, "s")
      .replace(/j/g, "g")
      .replace(/f/g, "p")
      .replace(/h/g, "")
      .replace(/[aeiouy]/g, "");
    return out.replace(/(.)\1+/g, "$1");
  }
  return "";
}

// Israeli SI-1452 keyboard: the Hebrew letter printed on each Latin key.
const LATIN_TO_HEBREW_KEYS: Record<string, string> = {
  q: "/", w: "'", e: "ק", r: "ר", t: "א", y: "ט", u: "ו", i: "ן", o: "ם", p: "פ",
  a: "ש", s: "ד", d: "ג", f: "כ", g: "ע", h: "י", j: "ח", k: "ל", l: "ך", ";": "ף",
  z: "ז", x: "ס", c: "ב", v: "ה", b: "נ", n: "מ", m: "צ", ",": "ת", ".": "ץ",
};
const HEBREW_TO_LATIN_KEYS: Record<string, string> = Object.fromEntries(
  Object.entries(LATIN_TO_HEBREW_KEYS).map(([latin, hebrew]) => [hebrew, latin])
);
// Final forms sit on their own keys; after normalization they are folded.
Object.assign(HEBREW_TO_LATIN_KEYS, { כ: "f", מ: "n", נ: "b", פ: "p", צ: "m" });

/**
 * The same keystrokes read on the other keyboard layout: "nerr" → "מקרר",
 * "דשצדומע" → "samsung". Returns null when the token is not purely one
 * script (nothing sensible to swap).
 */
export function swapKeyboardLayout(raw: string): string | null {
  const lower = raw.toLowerCase();
  if (/^[a-z;,.]+$/.test(lower)) {
    return Array.from(lower).map((ch) => LATIN_TO_HEBREW_KEYS[ch] ?? ch).join("");
  }
  if (/^[א-ת]+$/.test(lower)) {
    return Array.from(lower).map((ch) => HEBREW_TO_LATIN_KEYS[ch] ?? ch).join("");
  }
  return null;
}

/** Model numbers compared without separators: "RF-65A967" ≈ "rf65a967". */
export function compactModel(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9א-ת]/g, "");
}
