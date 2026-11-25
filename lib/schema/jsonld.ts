import { absoluteUrl, BUSINESS, EXPERT } from "@/lib/utils";
import { BUSINESS_HOURS_SCHEMA } from "@/content/businessHours";
import { BUSINESS_PROFILES } from "@/content/reviews";
import { cleanModelNumber } from "@/lib/normalize";

const ORGANIZATION_ID = absoluteUrl("/#organization");
const STORE_ID = absoluteUrl("/#store");
const WEBSITE_ID = absoluteUrl("/#website");
const PROFILE_URLS = BUSINESS_PROFILES.map((profile) => profile.url);

function openingHoursSpecification() {
  return BUSINESS_HOURS_SCHEMA.map((entry) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: entry.dayOfWeek.map((day) => `https://schema.org/${day}`),
    opens: entry.opens,
    closes: entry.closes,
  }));
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: BUSINESS.nameHe,
    alternateName: BUSINESS.nameEn,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      "@id": absoluteUrl("/#logo"),
      url: absoluteUrl("/brand/logo.png"),
      contentUrl: absoluteUrl("/brand/logo.png"),
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+972-4-9920948",
      contactType: "customer service",
      availableLanguage: ["he", "en", "ru"],
      areaServed: "IL",
    },
    knowsAbout: [
      "מקררים",
      "מכונות כביסה",
      "מייבשי כביסה",
      "מדיחי כלים",
      "תנורים וכיריים",
      "טלוויזיות",
      "מזגנים",
      "שואבי אבק",
    ],
    sameAs: PROFILE_URLS,
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    "@id": STORE_ID,
    name: BUSINESS.nameHe,
    alternateName: BUSINESS.nameEn,
    url: absoluteUrl("/"),
    telephone: "+972-4-9920948",
    image: absoluteUrl("/brand/logo.png"),
    // The store serves customers in all three languages and says so on its
    // Russian and English pages; declaring it here lets an answer engine
    // resolve "магазин электротоваров с русским языком" to this business.
    knowsLanguage: ["he", "ru", "en"],
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
    openingHoursSpecification: openingHoursSpecification(),
    parentOrganization: { "@id": ORGANIZATION_ID },
    sameAs: PROFILE_URLS,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "קטלוג מוצרי החשמל של חדד יובל אלקטריק",
      url: absoluteUrl("/products"),
    },
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
    "@id": WEBSITE_ID,
    // Google's site-name system reads name + alternateName from the home
    // page's WebSite markup; without them it falls back to the bare domain.
    name: BUSINESS.nameHe,
    alternateName: ["חדד אלקטריק", BUSINESS.nameEn],
    url: absoluteUrl("/"),
    inLanguage: "he-IL",
    publisher: { "@id": ORGANIZATION_ID },
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

/**
 * Service schema for an area page.
 *
 * The business has one physical store in Nahariya. Area pages describe service
 * coverage; they must not create a second ElectronicsStore entity whose URL
 * looks like another branch.
 */
export function localBusinessAreaJsonLd(params: {
  city: string;
  path: string;
  areasServed: string[];
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": absoluteUrl(`${params.path}#service`),
    name: `ייעוץ, מכירה ואספקת מוצרי חשמל ב${params.city}`,
    url: absoluteUrl(params.path),
    description: params.description,
    serviceType: "ייעוץ, מכירה, משלוח ותיאום התקנת מוצרי חשמל לבית",
    provider: storeReference(),
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

/// ─── Why product pages carry `ProductModel` with no `offers` ───
//
// This is a quote-based catalog: no prices, no checkout, no on-site reviews.
// Google validates anything typed `Product` against its product rich results:
//
//   - `Product` + `offers` without a price → *Product snippets* critical error
//     "price or priceSpecification.price must be specified", and *Merchant
//     listings* critical errors plus shipping / returns / category warnings.
//     (Shipped this way Aug 21 – Nov 22 2026; every product page was invalid.)
//   - `Product` without `offers` → critical error "Either offers, review or
//     aggregateRating should be specified" (the Jul 2026 attempt).
//
// None of those can be satisfied truthfully, and a placeholder price would be
// false. Checked in the Rich Results Test on 2026-11-22: a `ProductModel`
// (schema.org's "datasheet or vendor specification of a product" — exactly
// what these pages are) with no `offers` is detected by neither report, so
// no item is invalid, while every identity property (brand, mpn, sku, specs,
// typed dimensions, weight) stays valid schema.org, because ProductModel is a
// subtype of Product. That entity data is what answer engines read.
//
// Do not add `offers` back, and do not change the type to `Product`, unless
// the store starts publishing real prices.
//
// Product pages also expose BreadcrumbList via <Breadcrumbs>.

/**
 * A self-contained reference to the store.
 *
 * `@id` resolves per document, not per site. The full ElectronicsStore node
 * ships on three pages only, so a bare `{ "@id": STORE_ID }` anywhere else
 * points at nothing and collapses to an untyped blank node — worse than
 * saying nothing. This carries enough to stand alone and still merges with
 * the full node wherever that node is present.
 */
export function storeReference() {
  return {
    "@type": "ElectronicsStore",
    "@id": STORE_ID,
    name: BUSINESS.nameHe,
    url: absoluteUrl("/"),
  };
}

export function productJsonLd(params: {
  name: string;
  description: string;
  path: string;
  modelNumber: string;
  brand?: string | null;
  brandAlternateNames?: string[];
  category?: string | null;
  imageUrl?: string | null;
  /** The full gallery, lead shot first. Falls back to `imageUrl` alone. */
  images?: string[];
  originCountry?: string | null;
  specs?: { label: string; value: string }[];
  /** Parsed physical dimensions in centimetres, when the feed supplies them. */
  dimensionsCm?: { widthCm: number; heightCm: number; heightMaxCm?: number; depthCm: number } | null;
  /** Verified product weight in kilograms, from the research record. */
  weightKg?: number | null;
  /**
   * Yuval's note, when he has written one for this model. Emitted only on
   * the Hebrew page: the note is Hebrew prose, and attaching it to an
   * English or Russian page's markup would describe that page in a language
   * it is not written in.
   */
  expertNote?: string | null;
}) {
  const url = absoluteUrl(params.path);
  // Every distinct shot, lead first. A product with a gallery gives an image
  // search and a shopping surface more than one crop to choose from, and the
  // single-image case is unchanged because dedupe leaves it a one-element list.
  const images = Array.from(new Set([...(params.images ?? []), params.imageUrl].filter(Boolean) as string[]));

  // The note leads the description when there is one. `description` must
  // match what the page shows, and it does: the note is rendered in full, in
  // its own section, above the fold on the same URL. What changes is which
  // sentence a machine reading this page quotes first — a human judgement
  // about the model, or the generated identity line every competitor's feed
  // produces too.
  const expertNote = params.expertNote?.trim();
  const description = expertNote ? `${expertNote}\n\n${params.description}` : params.description;

  // Only labelled specs become properties: an unlabelled free-text line is a
  // sentence, not a name/value pair, and would produce meaningless triples.
  const additionalProperty = (params.specs ?? [])
    .filter((spec) => spec.label.trim() && spec.value.trim())
    .map((spec) => ({ "@type": "PropertyValue", name: spec.label.trim(), value: spec.value.trim() }));

  return {
    "@context": "https://schema.org",
    "@type": "ProductModel",
    "@id": `${url}#product`,
    name: params.name,
    description,
    url,
    // sku/mpn are identifiers a shopping engine matches on, so they carry the
    // manufacturer's model number and not the importer's internal code.
    sku: cleanModelNumber(params.modelNumber),
    mpn: cleanModelNumber(params.modelNumber),
    ...(images.length ? { image: images } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.brand
      ? {
          brand: {
            "@type": "Brand",
            name: params.brand,
            ...(params.brandAlternateNames?.length ? { alternateName: params.brandAlternateNames } : {}),
          },
        }
      : {}),
    ...(params.originCountry ? { countryOfOrigin: { "@type": "Country", name: params.originCountry } } : {}),
    ...(additionalProperty.length ? { additionalProperty } : {}),
    // Typed measurements, not just a spec row. This is what lets an answer
    // engine respond to "how wide is model X" or "will it fit a 55 cm niche"
    // from the markup rather than by guessing from prose.
    ...(params.dimensionsCm
      ? {
          width: { "@type": "QuantitativeValue", value: Number(params.dimensionsCm.widthCm.toFixed(1)), unitCode: "CMT" },
          // An adjustable height is published as the range it is, not as either end.
          height:
            params.dimensionsCm.heightMaxCm === undefined
              ? { "@type": "QuantitativeValue", value: Number(params.dimensionsCm.heightCm.toFixed(1)), unitCode: "CMT" }
              : {
                  "@type": "QuantitativeValue",
                  minValue: Number(params.dimensionsCm.heightCm.toFixed(1)),
                  maxValue: Number(params.dimensionsCm.heightMaxCm.toFixed(1)),
                  unitCode: "CMT",
                },
          depth: { "@type": "QuantitativeValue", value: Number(params.dimensionsCm.depthCm.toFixed(1)), unitCode: "CMT" },
        }
      : {}),
    // Deliberately an Article and not a Review. A review carries a rating,
    // and a rating the seller awards its own stock is the kind of markup
    // Google treats as self-serving and discounts — or penalises. What is
    // true here is narrower and still worth stating: a named person at this
    // shop wrote a piece about this product. `subjectOf` says exactly that
    // and claims nothing about how good the product is.
    ...(expertNote
      ? {
          subjectOf: {
            "@type": "Article",
            "@id": `${url}#expert-note`,
            headline: `הערת מומחה על ${cleanModelNumber(params.modelNumber)}`,
            articleBody: expertNote,
            inLanguage: "he-IL",
            isPartOf: { "@id": url },
            author: {
              "@type": "Person",
              name: EXPERT.nameHe,
              alternateName: EXPERT.nameEn,
              jobTitle: EXPERT.roleHe,
              worksFor: storeReference(),
            },
            publisher: storeReference(),
          },
        }
      : {}),
    ...(params.weightKg ? { weight: { "@type": "QuantitativeValue", value: params.weightKg, unitCode: "KGM" } } : {}),
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

export function collectionPageJsonLd(params: {
  name: string;
  description: string;
  path: string;
  image?: string;
  dateModified?: string;
  items: { name: string; path: string; image?: string | null }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: params.name,
    description: params.description,
    url: absoluteUrl(params.path),
    inLanguage: "he-IL",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    ...(params.dateModified ? { dateModified: params.dateModified } : {}),
    ...(params.image ? { primaryImageOfPage: absoluteUrl(params.image) } : {}),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: params.items.length,
      itemListElement: params.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
        ...(item.image ? { image: item.image.startsWith("http") ? item.image : absoluteUrl(item.image) } : {}),
      })),
    },
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
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    datePublished: params.datePublished ?? "2026-01-01",
  };
}
