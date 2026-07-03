import { absoluteUrl, BUSINESS } from "@/lib/utils";
import type { Product } from "@/types/product";

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
    telephone: BUSINESS.phoneDisplay,
    image: absoluteUrl("/brand/logo.png"),
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.addressStreet,
      addressLocality: BUSINESS.addressCity,
      addressCountry: "IL",
    },
    sameAs: [BUSINESS.facebookUrl],
    areaServed: ["נהריה", "חיפה", "צפון ישראל", "גליל מערבי", "עכו", "קריות", "כרמיאל", "מעלות תרשיחא", "שלומי", "קריית שמונה"],
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

export function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    description: product.description,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    model: product.modelNumber,
    sku: product.modelNumber,
    category: product.category ?? undefined,
    countryOfOrigin: product.originCountry ?? undefined,
    offers: {
      "@type": "Offer",
      availability:
        product.availability === "in_stock"
          ? "https://schema.org/InStock"
          : product.availability === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/LimitedAvailability",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: undefined,
      price: undefined,
      itemCondition: "https://schema.org/NewCondition",
    },
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
