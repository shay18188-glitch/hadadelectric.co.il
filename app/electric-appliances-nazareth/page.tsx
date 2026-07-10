import type { Metadata } from "next";
import { getLocalPageByPath } from "@/content/localPages";
import { LocalAreaPageContent } from "@/components/LocalAreaPageContent";
import { getCategories } from "@/lib/base44/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

const content = getLocalPageByPath("/electric-appliances-nazareth")!;

export const revalidate = 10800; // 3 hours

export const metadata: Metadata = buildMetadata({
  title: content.metaTitle,
  description: content.metaDescription,
  path: content.path,
});

export default async function Page() {
  const categories = await getCategories();
  return <LocalAreaPageContent content={content} categories={categories} />;
}
