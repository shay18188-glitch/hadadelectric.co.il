import type { Metadata } from "next";
import { getLocalPageByPath } from "@/content/localPages";
import { LocalAreaPageContent } from "@/components/LocalAreaPageContent";
import { getCategories, getCategoryStock } from "@/lib/base44/catalog";
import { generateLocalPageMetadata } from "@/lib/seo/metadata";

const content = getLocalPageByPath("/electric-appliances-nof-hagalil")!;

export const revalidate = 10800; // 3 hours

export const metadata: Metadata = generateLocalPageMetadata({
  title: content.metaTitle,
  description: content.metaDescription,
  path: content.path,
});

export default async function Page() {
  const [categories, stock] = await Promise.all([getCategories(), getCategoryStock()]);
  return <LocalAreaPageContent content={content} categories={categories} stock={stock} />;
}
