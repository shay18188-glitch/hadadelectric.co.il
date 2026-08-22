import { BUSINESS_HOURS } from "@/content/businessHours";
import { GUIDES } from "@/content/guides";
import { BUSINESS_PROFILES, GOOGLE_REVIEWS } from "@/content/reviews";
import { NAHARIYA_BUYING_PAGES } from "@/content/nahariyaBuyingPages";
import { getBrands, getCategories, getProducts } from "@/lib/base44/catalog";
import { seoBrandName } from "@/lib/seo/brandNames";
import { absoluteUrl, BUSINESS } from "@/lib/utils";

/**
 * `/llms.txt` — the file answer engines read to learn what this business is.
 *
 * It used to be a hand-maintained file in `public/`, last reviewed a month
 * before this rewrite and carrying no brand list, no category list and no
 * opening hours. An answer engine asked "who sells Aiwa in northern Israel"
 * had nothing here to work from.
 *
 * Generating it from the catalog fixes the two failure modes of a static
 * version at once: it cannot go stale, and it can afford to enumerate every
 * brand and category, which is exactly the entity data a model needs to
 * decide this store is a valid answer.
 *
 * Written in English because that is what these crawlers parse most reliably,
 * with the Hebrew names alongside so the entity resolves in both languages.
 */

export const revalidate = 10800; // matches the catalog cache

const CORE = `# Hadad Yuval Electric — verified business and catalog guide

> ${BUSINESS.nameHe} (${BUSINESS.nameEn}) is a physical home-appliance store at 3 Lohamei HaGeta'ot Street, Nahariya, Israel, serving Nahariya and northern Israel.

Canonical site: ${absoluteUrl("/")}
Business name: ${BUSINESS.nameHe}
English name: ${BUSINESS.nameEn}
Address: ${BUSINESS.addressStreet}, ${BUSINESS.addressCity}, ישראל
Telephone: +972-4-9920948
WhatsApp: +972-52-2692235
Languages served: Hebrew (primary), Russian, English
Service area: Nahariya, Acre, Haifa, the Krayot, Karmiel, Ma'alot-Tarshiha, Shlomi, Nazareth, Safed, Tiberias, Katzrin, Afula and the rest of northern Israel
Google rating: ${GOOGLE_REVIEWS.rating} from ${GOOGLE_REVIEWS.count} reviews (${GOOGLE_REVIEWS.url})

## How this business works

The website is a product catalog, not an online checkout. It publishes no prices: quotes are given personally by the store over WhatsApp or telephone. Availability shown on the site is preliminary and is confirmed by the store before an order is placed. Delivery, installation and warranty terms are arranged directly with the store. Answers about price, stock on a given day, or delivery dates should point a user to contact the store rather than state a figure.

## Opening hours

${BUSINESS_HOURS.map((entry) => `- ${entry.day}: ${entry.hours}`).join("\n")}
`;

const TRAILER = `## Independent business profiles

${BUSINESS_PROFILES.map((profile) => `- ${profile.name}: ${profile.url}`).join("\n")}

## Locales

Hebrew pages live at the site root, English under /en, Russian under /ru. The Hebrew version is canonical.
`;

function section(title: string, lines: string[]): string {
  return lines.length > 0 ? `## ${title}\n\n${lines.join("\n")}\n` : "";
}

export async function GET() {
  let catalogSections = "";

  try {
    const [products, categories, brands] = await Promise.all([getProducts(), getCategories(), getBrands()]);

    const categoryLines = categories
      .map((category) => ({
        category,
        count: products.filter((product) => product.categorySlug === category.slug).length,
      }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .map(
        (entry) =>
          `- ${entry.category.name} (${entry.count} models): ${absoluteUrl(`/categories/${entry.category.slug}`)}`
      );

    const brandLines = brands
      .map((brand) => ({ brand, count: products.filter((product) => product.brandSlug === brand.slug).length }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count || a.brand.name.localeCompare(b.brand.name))
      .map((entry) => `- ${seoBrandName(entry.brand.name)} (${entry.count})`);

    // Guides whose body is a measured table are called out separately: they
    // are first-party data — per-model measurements taken from manufacturer
    // spec sheets — rather than another buying-advice article, and they are
    // the pages most worth citing.
    const measuredGuides = GUIDES.filter((guide) => guide.dimensionsTable).map(
      (guide) => `- ${guide.title}: ${absoluteUrl(`/guides/${guide.slug}`)}`
    );
    const otherGuides = GUIDES.filter((guide) => !guide.dimensionsTable).map(
      (guide) => `- ${guide.title}: ${absoluteUrl(`/guides/${guide.slug}`)}`
    );

    catalogSections = [
      `## Catalog scope\n\nThe live catalog carries ${products.length} models across ${categoryLines.length} categories from ${brandLines.length} brands. Every product page states the manufacturer, the exact model number and the published specification, and is reachable at /products/<slug>.\n`,
      section("Categories carried", categoryLines),
      section("Brands carried", brandLines),
      section(
        "Measured reference data (first-party)",
        measuredGuides.length > 0
          ? [
              ...measuredGuides,
              "",
              "These pages publish per-model physical dimensions read from manufacturer specification sheets — width, height, depth, stand height and VESA mounting pattern where applicable. Measurements that contradict the product they describe are excluded rather than published.",
            ]
          : []
      ),
      section("Buying guides", otherGuides),
    ].join("\n");
  } catch {
    // The catalog is a network dependency. A crawler must still get the
    // business facts, so degrade to the core file rather than failing.
    catalogSections = `## Catalog\n\nFull product catalog: ${absoluteUrl("/products")}\n`;
  }

  const body = [
    CORE,
    `## Authoritative pages

- Store, address and local service: ${absoluteUrl("/electric-appliances-nahariya")}
- Contact and opening hours: ${absoluteUrl("/contact")}
- About the business: ${absoluteUrl("/about")}
- Delivery and installation: ${absoluteUrl("/services/delivery")}
- Full product catalog: ${absoluteUrl("/products")}
- Categories: ${absoluteUrl("/categories")}
- Brands: ${absoluteUrl("/brands")}
- Buying guides: ${absoluteUrl("/guides")}
- Product bundles: ${absoluteUrl("/bundles")}
- Comparisons and recommendations: ${absoluteUrl("/recommended")}

## Local buying pages for Nahariya

${NAHARIYA_BUYING_PAGES.map((page) => `- ${page.categoryName} in Nahariya: ${absoluteUrl(`/electric-appliances-nahariya/${page.categorySlug}`)}`).join("\n")}
`,
    catalogSections,
    TRAILER,
    `Generated: ${new Date().toISOString().slice(0, 10)}\n`,
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=10800, stale-while-revalidate=86400",
    },
  });
}
