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
    name: BUSINESS.nameHe,
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

// NOTE: We intentionally do NOT emit `Product` structured data on product
/// ─── Why product pages carry `Product` and not a rich-result-safe stand-in ───
//
// The earlier decision here was to emit `ItemPage` and skip `Product`
// entirely: this is a catalog with no prices, no checkout and no on-site
// reviews, so `offers.price` cannot be supplied truthfully and Search
// Console's *Merchant listings* report will flag every item with
// "Missing field 'price'".
//
// That trade is now the wrong way round. `ItemPage` tells a crawler that a URL
// exists; it says nothing about which manufacturer, which model number, or
// which specifications the page describes. Answer engines resolving "who sells
// the Aiwa AI16000 in Israel" read exactly those properties, and Search
// Console already records live *Product snippet* impressions for this site —
// an experience that stays eligible as long as `offers` is present, with or
// without a price.
//
// So: emit the full entity, keep `offers` for availability, and accept the
// Merchant-listings warning as the correct outcome for a quote-based store.
// Do not "fix" that warning by inventing a price.
//
// Product pages also expose BreadcrumbList via <Breadcrumbs>.

/**
 * Product entity for a catalog page.
 *
 * Replaces the previous generic `ItemPage`, which told Google and answer
 * engines that a URL existed but never that it described a specific model
 * from a specific manufacturer. Everything here is machine-checkable fact
 * taken from the catalog record — nothing is inferred.
 *
 * Deliberately no `price` / `priceCurrency`: this store quotes personally and
 * publishes no prices, so inventing one would be false. Search Console will
 * report "Missing field price" as a non-critical warning on these items. That
 * warning is the correct outcome and must not be "fixed" with a placeholder —
 * the entity data (brand, mpn, specs, availability, seller) is what earns
 * citations in AI answers and what makes a model-number query resolvable.
 */
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
  availability: "in_stock" | "out_of_stock" | "unknown";
  specs?: { label: string; value: string }[];
  /** Parsed physical dimensions in centimetres, when the feed supplies them. */
  dimensionsCm?: { widthCm: number; heightCm: number; depthCm: number } | null;
  /**
   * Yuval's note, when he has written one for this model. Emitted only on
   * the Hebrew page: the note is Hebrew prose, and attaching it to an
   * English or Russian page's markup would describe that page in a language
   * it is not written in.
   */
  expertNote?: string | null;
}) {
  const url = absoluteUrl(params.path);
  // "unknown" gets no availability at all. LimitedAvailability asserts that
  // stock is limited, which is a different claim from not knowing.
  const availability =
    params.availability === "in_stock"
      ? "https://schema.org/InStock"
      : params.availability === "out_of_stock"
        ? "https://schema.org/OutOfStock"
        : null;

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
    "@type": "Product",
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
          height: { "@type": "QuantitativeValue", value: Number(params.dimensionsCm.heightCm.toFixed(1)), unitCode: "CMT" },
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
    offers: {
      "@type": "Offer",
      url,
      ...(availability ? { availability } : {}),
      itemCondition: "https://schema.org/NewCondition",
      businessFunction: "http://purl.org/goodrelations/v1#Sell",
      seller: storeReference(),
      areaServed: { "@type": "AdministrativeArea", name: "צפון ישראל" },
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
