import type { MetadataRoute } from "next";
import { getBrands, getCategories, getProducts } from "@/lib/base44/catalog";
import { GUIDES } from "@/content/guides";
import { hasGuideTranslation, hasProductTranslation } from "@/lib/i18n/translated";
import { shouldIndexListing } from "@/lib/seo/indexPolicy";
import { BUNDLES } from "@/content/bundles";
import { LOCAL_PAGES } from "@/content/localPages";
import { SITE_URL } from "@/lib/utils";
import { getSeoBrandCategoryCombos } from "@/lib/seo/brandCategoryCombos";
import { RECOMMENDATION_PAGES } from "@/content/recommendationPages";
import { categoryImageFor } from "@/lib/categoryVisuals";
import { NAHARIYA_BUYING_PAGES } from "@/content/nahariyaBuyingPages";

export const revalidate = 10800; // 3 hours

const STATIC_PATHS = [
  "",
  "/products",
  "/categories",
  "/brands",
  "/guides",
  "/bundles",
  "/recommended",
  "/services/delivery",
  "/about",
  "/contact",
  "/faq",
  "/privacy-policy",
  "/accessibility",
  "/terms",
];

// Translated (en/ru) versions of core pages; Hebrew equivalents are in
// STATIC_PATHS and TRANSLATED_PATHS in lib/i18n/locales.ts maps the pairs.
const LOCALIZED_PATHS = [
  "/en",
  "/en/about",
  "/en/contact",
  "/en/delivery",
  "/en/faq",
  "/en/guides",
  "/en/products",
  "/ru",
  "/ru/about",
  "/ru/contact",
  "/ru/delivery",
  "/ru/faq",
  "/ru/guides",
  "/ru/products",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands, brandCategoryCombos] = await Promise.all([
    getProducts(),
    getCategories(),
    getBrands(),
    getSeoBrandCategoryCombos(),
  ]);
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const localizedEntries: MetadataRoute.Sitemap = LOCALIZED_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/en" || path === "/ru" ? 0.8 : 0.6,
  }));

  const localEntries: MetadataRoute.Sitemap = LOCAL_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const nahariyaBuyingEntries: MetadataRoute.Sitemap = NAHARIYA_BUYING_PAGES.map((page) => ({
    url: `${SITE_URL}/electric-appliances-nahariya/${page.categorySlug}`,
    lastModified: new Date("2026-07-23"),
    changeFrequency: "weekly",
    priority: 0.8,
    images: [`${SITE_URL}${categoryImageFor(page.categorySlug)}`],
  }));

  // Locale variants are listed only once a translation actually exists —
  // submitting a URL that still renders Hebrew wastes crawl budget on a page
  // that is noindexed anyway.
  const guideEntries: MetadataRoute.Sitemap = GUIDES.flatMap((guide) =>
    ([
      ["", "he"],
      ["/en", "en"],
      ["/ru", "ru"],
    ] as const)
      .filter(([, locale]) => hasGuideTranslation(guide.slug, locale))
      .map(([prefix]) => ({
        url: `${SITE_URL}${prefix}/guides/${guide.slug}`,
        lastModified: guide.publishedDate ? new Date(guide.publishedDate) : now,
        changeFrequency: "monthly" as const,
        priority: prefix === "" ? 0.5 : 0.4,
      }))
  );

  const bundleEntries: MetadataRoute.Sitemap = BUNDLES.map((bundle) => ({
    url: `${SITE_URL}/bundles/${bundle.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
    images: [`${SITE_URL}${bundle.image}`],
  }));

  // Thin listings are noindexed (lib/seo/indexPolicy.ts); submitting them here
  // would only spend crawl budget on pages Google is told to drop.
  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((category) => shouldIndexListing(category.productCount))
    .map((category) => ({
      url: `${SITE_URL}/categories/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const brandEntries: MetadataRoute.Sitemap = brands
    .filter((brand) => shouldIndexListing(brand.productCount))
    .map((brand) => ({
      url: `${SITE_URL}/brands/${brand.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  const brandCategoryEntries: MetadataRoute.Sitemap = brandCategoryCombos.map((combo) => ({
    url: `${SITE_URL}/brands/${combo.brandSlug}/${combo.categorySlug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  const recommendationEntries: MetadataRoute.Sitemap = RECOMMENDATION_PAGES.map((page) => ({
    url: `${SITE_URL}/recommended/${page.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
    images: [`${SITE_URL}${categoryImageFor(page.categorySlug)}`],
  }));

  // Same rule as guides: 90 of the products have no translation entry yet and
  // would render Hebrew under an /en or /ru URL. Those variants are noindexed,
  // so they do not belong in the sitemap either.
  const productEntries: MetadataRoute.Sitemap = products.flatMap((product) =>
    ([
      ["", "he"],
      ["/en", "en"],
      ["/ru", "ru"],
    ] as const)
      .filter(([, locale]) => hasProductTranslation(product.modelNumber, locale))
      .map(([prefix]) => ({
        url: `${SITE_URL}${prefix}/products/${encodeURIComponent(product.slug)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: prefix === "" ? 0.5 : 0.4,
      }))
  );

  return [
    ...staticEntries,
    ...localizedEntries,
    ...localEntries,
    ...nahariyaBuyingEntries,
    ...guideEntries,
    ...bundleEntries,
    ...categoryEntries,
    ...brandEntries,
    ...brandCategoryEntries,
    ...recommendationEntries,
    ...productEntries,
  ];
}
