import type { Metadata } from "next";
import { absoluteUrl, BUSINESS } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";
import type { Brand } from "@/types/brand";
import { seoBrandName } from "@/lib/seo/brandNames";
import { productSearchTitle, productMetaDescription, type SeoLocale } from "@/lib/seo/productNaming";
import { shouldIndexListing } from "@/lib/seo/indexPolicy";
import { hasProductTranslation } from "@/lib/i18n/translated";

export const SITE_NAME = BUSINESS.nameHe;
export const DEFAULT_DESCRIPTION =
  "קטלוג מוצרי חשמל לבית בנהריה והצפון. בדיקת זמינות מהירה והזמנה ישירה בוואטסאפ או בטלפון — ללא מחירים וללא סליקה באתר.";

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  images?: string[];
  /** Content language of the page. Defaults to Hebrew. */
  locale?: "he" | "en" | "ru";
  /**
   * Opt out of the root layout's `%s | site` template. Product titles build
   * their own store suffix (a shorter one, and droppable when the model number
   * needs the room), so they must not have a second one appended.
   */
  absoluteTitle?: boolean;
  /**
   * Paths of this page's translations keyed by locale, for hreflang.
   * Include ALL locales the page exists in (itself included);
   * x-default points at the Hebrew version.
   */
  translations?: Partial<Record<"he" | "en" | "ru", string>>;
}

const OG_LOCALE = { he: "he_IL", en: "en_US", ru: "ru_RU" } as const;
const HREFLANG = { he: "he-IL", en: "en", ru: "ru" } as const;

export function buildMetadata({
  title,
  description,
  path,
  noindex,
  images,
  locale = "he",
  absoluteTitle,
  translations,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = images?.[0] ?? absoluteUrl("/opengraph-image");

  // A noindex page must not carry hreflang. Emitting it produced two
  // conflicting x-default declarations for one cluster, one of them pointing
  // at a page Google was told to drop.
  const languages: Record<string, string> = {};
  if (noindex) {
    // no alternates
  } else if (translations) {
    for (const [loc, translationPath] of Object.entries(translations)) {
      languages[HREFLANG[loc as keyof typeof HREFLANG]] = absoluteUrl(translationPath);
    }
    languages["x-default"] = absoluteUrl(translations.he ?? path);
  } else {
    // Hebrew-only page: self-referencing hreflang.
    languages[HREFLANG[locale]] = url;
    languages["x-default"] = url;
  }

  return {
    // Hebrew pages use the root layout's "%s | site" template; en/ru pages
    // carry the brand in the title itself, so make it absolute.
    title: locale === "he" && !absoluteTitle ? title : { absolute: title },
    description,
    alternates: {
      canonical: url,
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
    },
    robots: noindex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          // Allow large image previews so product photos can appear as
          // result thumbnails (Google defaults to small ones otherwise).
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title,
      description,
      url,
      siteName: locale === "he" ? SITE_NAME : BUSINESS.nameEn,
      locale: OG_LOCALE[locale],
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Product metadata for any locale.
 *
 * `product` must already be localized for `locale` — the caller owns that, so
 * that an English page never ships a Hebrew title. The title and description
 * templates live in `productNaming` and are simulated across the whole catalog
 * by `scripts/seo-simulate.mts` before any template change ships.
 */
export function generateProductMetadata(product: Product, locale: SeoLocale = "he"): Metadata {
  const hebrewPath = `/products/${product.slug}`;
  const path = locale === "he" ? hebrewPath : `/${locale}${hebrewPath}`;
  const translated = hasProductTranslation(product.modelNumber, locale);

  // Only advertise the locale variants that carry real translated copy.
  const translations = {
    he: hebrewPath,
    ...(hasProductTranslation(product.modelNumber, "en") ? { en: `/en${hebrewPath}` } : {}),
    ...(hasProductTranslation(product.modelNumber, "ru") ? { ru: `/ru${hebrewPath}` } : {}),
  };

  return buildMetadata({
    title: productSearchTitle(product, locale),
    description: productMetaDescription(product, locale),
    path,
    locale,
    absoluteTitle: true,
    noindex: !translated,
    images: product.imageUrl ? [product.imageUrl] : undefined,
    translations,
  });
}

export function generateCategoryMetadata(category: Category): Metadata {
  return buildMetadata({
    // A listing with one or two products is that product with extra chrome.
    // See lib/seo/indexPolicy.ts.
    noindex: !shouldIndexListing(category.productCount),
    title: withStoreSuffix(`${category.name} בנהריה והצפון — קטלוג, זמינות והזמנה`),
    absoluteTitle: true,
    description: `${category.name} בחדד יובל אלקטריק בנהריה — מותגים מובילים, בדיקת זמינות באתר והזמנה בוואטסאפ או בטלפון, עם משלוח והתקנה עד בית הלקוח בכל הצפון.`,
    path: `/categories/${category.slug}`,
  });
}

export function generateBrandMetadata(brand: Brand): Metadata {
  return buildMetadata({
    noindex: !shouldIndexListing(brand.productCount),
    title: withStoreSuffix(`מוצרי ${seoBrandName(brand.name) ?? brand.name} בנהריה והצפון`),
    absoluteTitle: true,
    description: `מוצרי ${brand.name} בחדד יובל אלקטריק בנהריה — קטלוג, זמינות והזמנה בוואטסאפ או בטלפון, עם משלוח והתקנה עד בית הלקוח בכל הצפון.`,
    path: `/brands/${brand.slug}`,
  });
}

/**
 * Area-page metadata.
 *
 * The authored title already carries its own second segment, so letting the
 * root template append "| חדד יובל אלקטריק בע״מ" produced a double-pipe title
 * of 67–68 characters — clipped in the SERP, with the store name the part that
 * got cut. The two area pages with the best click-through (Shlomi at 8.7%,
 * Tamra at 6.8%) are also the two shortest titles. Build the suffix here, in
 * the short form, and only when there is room for it.
 */
/**
 * Appends the store name only when the SERP has room for all of it.
 *
 * The root layout's `%s | חדד יובל אלקטריק בע״מ` template adds 23 characters
 * unconditionally, which pushed authored titles past what Google renders. The
 * cut always landed on the store name — or worse, mid-word — and the pages it
 * hit hardest were the ones with the most descriptive titles. Here the suffix
 * is the shorter legal-free form, and it is dropped rather than truncated, so
 * every authored word stays visible.
 */
export function withStoreSuffix(title: string, max = 65): string {
  const suffix = ` | ${BUSINESS.nameHe.replace(" בע״מ", "")}`;
  return title.length + suffix.length <= max ? `${title}${suffix}` : title;
}

export function generateLocalPageMetadata(params: { title: string; description: string; path: string }): Metadata {
  return buildMetadata({ ...params, title: withStoreSuffix(params.title), absoluteTitle: true });
}

export function generateBrandCategoryMetadata(params: {
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  productCount: number;
}, copy?: { title: string; description: string }): Metadata {
  return buildMetadata({
    title: copy?.title ?? `${params.category} ${params.brand} בנהריה והצפון — קטלוג, זמינות והזמנה`,
    description:
      copy?.description ??
      `${params.category} ${params.brand} בחדד יובל אלקטריק — ${params.productCount} דגמים, בדיקת זמינות באתר, הצעת מחיר בוואטסאפ ומשלוח והתקנה עד בית הלקוח בכל אזור הצפון.`,
    path: `/brands/${params.brandSlug}/${params.categorySlug}`,
  });
}
