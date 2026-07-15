import type { Metadata } from "next";
import { absoluteUrl, BUSINESS } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";
import type { Brand } from "@/types/brand";

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
  translations,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = images?.[0] ?? absoluteUrl("/opengraph-image");

  const languages: Record<string, string> = {};
  if (translations) {
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
    title: locale === "he" ? title : { absolute: title },
    description,
    alternates: {
      canonical: url,
      languages,
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

export function generateProductMetadata(product: Product): Metadata {
  const title = product.name;
  const description =
    product.description.length > 155 ? `${product.description.slice(0, 152)}...` : product.description;
  const path = `/products/${product.slug}`;

  return buildMetadata({
    title,
    description,
    path,
    images: product.imageUrl ? [product.imageUrl] : undefined,
    translations: { he: path, en: `/en${path}`, ru: `/ru${path}` },
  });
}

export function generateCategoryMetadata(category: Category): Metadata {
  return buildMetadata({
    title: `${category.name} בנהריה והצפון — קטלוג, זמינות והזמנה`,
    description: `${category.name} בחדד יובל אלקטריק בנהריה — מותגים מובילים, בדיקת זמינות באתר והזמנה בוואטסאפ או בטלפון, עם משלוח והתקנה עד בית הלקוח בכל הצפון.`,
    path: `/categories/${category.slug}`,
  });
}

export function generateBrandMetadata(brand: Brand): Metadata {
  return buildMetadata({
    title: `מוצרי ${brand.name} בנהריה והצפון`,
    description: `מוצרי ${brand.name} בחדד יובל אלקטריק בנהריה — קטלוג, זמינות והזמנה בוואטסאפ או בטלפון, עם משלוח והתקנה עד בית הלקוח בכל הצפון.`,
    path: `/brands/${brand.slug}`,
  });
}

export function generateLocalPageMetadata(params: { title: string; description: string; path: string }): Metadata {
  return buildMetadata(params);
}

export function generateBrandCategoryMetadata(params: {
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  productCount: number;
}): Metadata {
  return buildMetadata({
    title: `${params.category} ${params.brand} בנהריה והצפון — קטלוג, זמינות והזמנה`,
    description: `${params.category} ${params.brand} בחדד יובל אלקטריק — ${params.productCount} דגמים, בדיקת זמינות באתר, הצעת מחיר בוואטסאפ ומשלוח והתקנה עד בית הלקוח בכל אזור הצפון.`,
    path: `/brands/${params.brandSlug}/${params.categorySlug}`,
  });
}
