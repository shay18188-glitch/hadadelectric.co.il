import { CATEGORY_SLUGS } from "@/lib/slug/categorySlugs";
import { legacySlugify } from "@/lib/slug/slugify";

/** Maps old Hebrew category URL segments to canonical English slugs. */
export const LEGACY_CATEGORY_SLUG_REDIRECTS: Record<string, string> = buildLegacyCategoryRedirects();

function buildLegacyCategoryRedirects(): Record<string, string> {
  const redirects: Record<string, string> = {};

  for (const [hebrewName, englishSlug] of Object.entries(CATEGORY_SLUGS)) {
    redirects[hebrewName] = englishSlug;

    const legacySlug = legacySlugify(hebrewName);
    if (legacySlug && legacySlug !== englishSlug) {
      redirects[legacySlug] = englishSlug;
    }
  }

  return redirects;
}

export function resolveLegacyCategorySlug(slug: string): string | null {
  const decoded = decodeURIComponent(slug.trim());
  return LEGACY_CATEGORY_SLUG_REDIRECTS[decoded] ?? null;
}
