import type { Metadata } from "next";
import { LOCAL_PAGES } from "@/content/localPages";
import { LocalAreaPageContent } from "@/components/LocalAreaPageContent";
import { getCategories, getCategoryStock } from "@/lib/base44/catalog";
import { generateLocalPageMetadata } from "@/lib/seo/metadata";
import { HE_RU_PATHS } from "@/lib/i18n/locales";
import { JsonLd } from "@/components/JsonLd";
import { localBusinessJsonLd } from "@/lib/schema/jsonld";

const content = LOCAL_PAGES.find((p) => p.path === "/electric-appliances-nahariya")!;

export const revalidate = 10800; // 3 hours

export const metadata: Metadata = generateLocalPageMetadata({
  title: content.metaTitle,
  description: content.metaDescription,
  path: content.path,
  // The only area page with a Russian counterpart; see HE_RU_PATHS.
  translations: HE_RU_PATHS[content.path],
});

export default async function Page() {
  const [categories, stock] = await Promise.all([getCategories(), getCategoryStock()]);
  return (
    <>
      {/*
        The store's own page, and the only area page that describes the
        physical shop rather than a service area. It carries the
        ElectronicsStore entity; every other city page keeps the Service
        markup, which is what stops them reading as branch locations.
      */}
      <JsonLd data={localBusinessJsonLd()} />
      <LocalAreaPageContent content={content} categories={categories} stock={stock} />
    </>
  );
}
