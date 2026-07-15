import { absoluteUrl, BUSINESS } from "@/lib/utils";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BUSINESS.nameHe,
    alternateName: BUSINESS.nameEn,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/logo.png"),
    sameAs: [BUSINESS.facebookUrl],
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    name: BUSINESS.nameHe,
    alternateName: BUSINESS.nameEn,
    url: absoluteUrl("/"),
    telephone: "+972-4-9920948",
    image: absoluteUrl("/brand/logo.png"),
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.addressStreet,
      addressLocality: BUSINESS.addressCity,
      addressCountry: "IL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 33.006,
      longitude: 35.098,
    },
    hasMap: "https://www.google.com/maps?q=לוחמי+הגטאות+3+נהריה",
    sameAs: [BUSINESS.facebookUrl],
    areaServed: [
      "נהריה", "עכו", "חיפה", "הקריות", "קריית אתא", "כרמיאל", "מעלות תרשיחא", "כפר ורדים", "שלומי",
      "ירכא", "כפר יאסיף", "ג'דיידה-מכר", "טמרה", "שפרעם", "סח'נין", "נצרת", "נוף הגליל", "עפולה",
      "יקנעם", "צפת", "טבריה", "ראש פינה", "חצור הגלילית", "קריית שמונה", "קצרין", "צפון ישראל",
    ].map((name) => ({ "@type": "City", name })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BUSINESS.nameHe,
    url: absoluteUrl("/"),
    inLanguage: "he-IL",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/products?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** LocalBusiness schema scoped to a specific service-area page (city page). */
export function localBusinessAreaJsonLd(params: {
  city: string;
  path: string;
  areasServed: string[];
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    name: BUSINESS.nameHe,
    alternateName: BUSINESS.nameEn,
    url: absoluteUrl(params.path),
    description: params.description,
    telephone: "+972-4-9920948",
    image: absoluteUrl("/brand/logo.png"),
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.addressStreet,
      addressLocality: BUSINESS.addressCity,
      addressCountry: "IL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 33.006,
      longitude: 35.098,
    },
    sameAs: [BUSINESS.facebookUrl],
    areaServed: [params.city, ...params.areasServed.filter((a) => a !== params.city)].map((name) => ({
      "@type": "City",
      name,
    })),
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

// NOTE: We intentionally do NOT emit `Product` structured data on product
// pages. This is a catalog site with no prices, no checkout and no reviews.
// Google's Product markup requires at least one of `offers` (which itself
// requires `price` + `priceCurrency`), `review`, or `aggregateRating`. We have
// none of them and must not fabricate them, so any `Product` markup is
// permanently "invalid" in Search Console (Merchant listings / Product
// snippets). Omitting the markup entirely keeps those reports clean while
// losing nothing — a price-less product can never win a Product rich result.
// Product pages still expose BreadcrumbList structured data via <Breadcrumbs>,
// and declare their main image via `itemPageJsonLd` below (ItemPage carries no
// rich-result requirements, so Search Console stays clean).

/**
 * ItemPage schema for product pages: declares the product photo as the page's
 * primary image so Google prefers it over the site logo when picking a search
 * result thumbnail.
 */
export function itemPageJsonLd(params: {
  name: string;
  description: string;
  path: string;
  imageUrl?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    name: params.name,
    description: params.description,
    url: absoluteUrl(params.path),
    ...(params.imageUrl
      ? {
          image: params.imageUrl,
          primaryImageOfPage: {
            "@type": "ImageObject",
            contentUrl: params.imageUrl,
          },
        }
      : {}),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function articleJsonLd(params: {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.title,
    description: params.description,
    url: absoluteUrl(params.path),
    author: { "@type": "Organization", name: BUSINESS.nameHe },
    publisher: { "@type": "Organization", name: BUSINESS.nameHe, logo: absoluteUrl("/brand/logo.png") },
    datePublished: params.datePublished ?? "2026-01-01",
  };
}
