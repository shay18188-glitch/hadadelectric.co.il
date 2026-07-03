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
}

export function buildMetadata({ title, description, path, noindex, images }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = images?.[0] ?? absoluteUrl("/opengraph-image");

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "he-IL": absoluteUrl("/"),
        "x-default": absoluteUrl("/"),
      },
    },
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "he_IL",
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

  return buildMetadata({
    title,
    description,
    path: `/products/${product.slug}`,
    images: product.imageUrl ? [product.imageUrl] : undefined,
  });
}

export function generateCategoryMetadata(category: Category): Metadata {
  return buildMetadata({
    title: `${category.name} בנהריה והצפון`,
    description: `קטלוג ${category.name} בחדד יובל אלקטריק — בדיקת זמינות ומידע מלא, עם אפשרות להזמנה ישירה בוואטסאפ או בטלפון לחנות בנהריה.`,
    path: `/categories/${category.slug}`,
  });
}

export function generateBrandMetadata(brand: Brand): Metadata {
  return buildMetadata({
    title: `מוצרי ${brand.name}`,
    description: `מוצרי ${brand.name} בחדד יובל אלקטריק בנהריה — קטלוג, זמינות והזמנה ישירה בוואטסאפ או בטלפון.`,
    path: `/brands/${brand.slug}`,
  });
}

export function generateLocalPageMetadata(params: { title: string; description: string; path: string }): Metadata {
  return buildMetadata(params);
}
