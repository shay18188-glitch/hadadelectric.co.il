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
  "/en/categories",
  "/ru/categories",
  // The Russian shop page for Nahariya. Hebrew-only elsewhere: this is the one
  // local page with Russian search demand behind it ("купить в израиле").
  "/ru/electric-appliances-nahariya",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands, brandCategoryCombos] = await Promise.all([
    getProducts(),
    getCategories(),
    getBrands(),
    getSeoBrandCategoryCombos(),
  ]);
  // Deliberately no blanket `lastModified`.
  //
  // Every entry used to carry the build timestamp, which told Google that all
  // 2,804 URLs changed together every three hours — a claim that is false for
  // almost all of them and that a crawler learns to discount wholesale. The
  // catalog record (`types/product.ts`) carries no update timestamp, so a
  // truthful per-product date cannot be derived today; omitting the field is
  // the honest option and costs nothing, because an always-now value carried no
  // information anyway. Guides keep their real `publishedDate`, and the one
  // hand-dated entry keeps its date. If the feed ever exposes a modification
  // time, reinstate it here per URL.
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const localizedEntries: MetadataRoute.Sitemap = LOCALIZED_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "/en" || path === "/ru" ? 0.8 : 0.6,
  }));

  const localEntries: MetadataRoute.Sitemap = LOCAL_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
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
    changeFrequency: "weekly",
    priority: 0.75,
    images: [`${SITE_URL}${bundle.image}`],
  }));

  // Thin listings are noindexed (lib/seo/indexPolicy.ts); submitting them here
  // would only spend crawl budget on pages Google is told to drop.
  const indexableCategories = categories.filter((category) => shouldIndexListing(category.productCount));

  const categoryEntries: MetadataRoute.Sitemap = indexableCategories.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Translated category listings. Unlike products — where 90 of 891 records
  // have no translation and the page is noindexed until the job runs — the
  // category name and every product tile on these pages come from the
  // committed stores, so a translated listing is always real content.
  // Russian earns this first: /ru averages position 8.0 at a 3.12% click rate,
  // the strongest template on the site after the home page.
  const localizedCategoryEntries: MetadataRoute.Sitemap = indexableCategories.flatMap((category) =>
    (["en", "ru"] as const).map((locale) => ({
      url: `${SITE_URL}/${locale}/categories/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  const brandEntries: MetadataRoute.Sitemap = brands
    .filter((brand) => shouldIndexListing(brand.productCount))
    .map((brand) => ({
      url: `${SITE_URL}/brands/${brand.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  const brandCategoryEntries: MetadataRoute.Sitemap = brandCategoryCombos.map((combo) => ({
    url: `${SITE_URL}/brands/${combo.brandSlug}/${combo.categorySlug}`,
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  const recommendationEntries: MetadataRoute.Sitemap = RECOMMENDATION_PAGES.map((page) => ({
    url: `${SITE_URL}/recommended/${page.slug}`,
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
    ...localizedCategoryEntries,
    ...brandEntries,
    ...brandCategoryEntries,
    ...recommendationEntries,
    ...productEntries,
  ];
}
