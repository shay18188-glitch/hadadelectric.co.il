/**
 * Locale core for the trilingual site. Hebrew is the default locale and owns
 * the root URLs; English and Russian live under /en and /ru. Client-safe.
 */

export type Locale = "he" | "en" | "ru";

export const LOCALES: readonly Locale[] = ["he", "en", "ru"] as const;
export const DEFAULT_LOCALE: Locale = "he";

export const LOCALE_PREFIX: Record<Locale, string> = { he: "", en: "/en", ru: "/ru" };

/** Value for the html lang attribute / hreflang key. */
export const LOCALE_HTML_LANG: Record<Locale, string> = { he: "he-IL", en: "en", ru: "ru" };

export const LOCALE_DIR: Record<Locale, "rtl" | "ltr"> = { he: "rtl", en: "ltr", ru: "ltr" };

/** Open Graph locale identifiers. */
export const LOCALE_OG: Record<Locale, string> = { he: "he_IL", en: "en_US", ru: "ru_RU" };

export const LOCALE_LABEL: Record<Locale, string> = { he: "עברית", en: "English", ru: "Русский" };

export function getLocaleFromPathname(pathname: string): Locale {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/ru" || pathname.startsWith("/ru/")) return "ru";
  return "he";
}

/**
 * Pages that exist in all three languages, keyed by the Hebrew (root) path.
 * The en/ru paths are the localized equivalents used for hreflang and for the
 * language switcher.
 */
export const TRANSLATED_PATHS: Record<string, Record<Locale, string>> = {
  "/": { he: "/", en: "/en", ru: "/ru" },
  "/about": { he: "/about", en: "/en/about", ru: "/ru/about" },
  "/contact": { he: "/contact", en: "/en/contact", ru: "/ru/contact" },
  "/faq": { he: "/faq", en: "/en/faq", ru: "/ru/faq" },
  "/services/delivery": { he: "/services/delivery", en: "/en/delivery", ru: "/ru/delivery" },
  "/guides": { he: "/guides", en: "/en/guides", ru: "/ru/guides" },
  "/products": { he: "/products", en: "/en/products", ru: "/ru/products" },
};

/**
 * Route families translated wholesale: every Hebrew path under these prefixes
 * has en/ru equivalents at /en<path> and /ru<path> (same slugs, translated
 * content with Hebrew fallback).
 */
const TRANSLATED_PREFIXES = ["/guides/", "/products/"];

/** Build the translation map for a Hebrew path, or null if untranslated. */
export function translationsForPath(hePath: string): Record<Locale, string> | null {
  if (TRANSLATED_PATHS[hePath]) return TRANSLATED_PATHS[hePath];
  if (TRANSLATED_PREFIXES.some((prefix) => hePath.startsWith(prefix))) {
    return { he: hePath, en: `/en${hePath}`, ru: `/ru${hePath}` };
  }
  return null;
}

/** Strip the /en|/ru prefix, yielding the Hebrew-equivalent path. */
export function stripLocalePrefix(pathname: string): string {
  if (pathname === "/en" || pathname === "/ru") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  if (pathname.startsWith("/ru/")) return pathname.slice(3);
  return pathname;
}

/**
 * Given the current pathname, return the best target path for each locale:
 * the translated equivalent when one exists, otherwise the locale home.
 */
export function switcherTargets(pathname: string): Record<Locale, string> {
  for (const entry of Object.values(TRANSLATED_PATHS)) {
    if (entry.he === pathname || entry.en === pathname || entry.ru === pathname) {
      return { ...entry };
    }
  }
  const translated = translationsForPath(stripLocalePrefix(pathname));
  if (translated) return { ...translated };
  const locale = getLocaleFromPathname(pathname);
  // Untranslated page (categories, brands, local pages…): keep Hebrew URLs
  // as-is, send other locales to their home page.
  return {
    he: locale === "he" ? pathname : "/",
    en: "/en",
    ru: "/ru",
  };
}
