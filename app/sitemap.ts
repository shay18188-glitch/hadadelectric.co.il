import type { MetadataRoute } from "next";
import { getBrands, getCategories, getProducts } from "@/lib/base44/catalog";
import { GUIDES } from "@/content/guides";
import { LOCAL_PAGES } from "@/content/localPages";
import { SITE_URL } from "@/lib/utils";

export const revalidate = 10800; // 3 hours

const STATIC_PATHS = [
  "",
  "/products",
  "/categories",
  "/brands",
  "/guides",
  "/about",
  "/contact",
  "/faq",
  "/privacy-policy",
  "/accessibility",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands] = await Promise.all([getProducts(), getCategories(), getBrands()]);
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const localEntries: MetadataRoute.Sitemap = LOCAL_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const guideEntries: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: `${SITE_URL}/guides/${guide.slug}`,
    lastModified: guide.publishedDate ? new Date(guide.publishedDate) : now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const brandEntries: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${SITE_URL}/brands/${brand.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${encodeURIComponent(product.slug)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticEntries, ...localEntries, ...guideEntries, ...categoryEntries, ...brandEntries, ...productEntries];
}
