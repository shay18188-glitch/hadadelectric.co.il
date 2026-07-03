import type { Metadata } from "next";
import { LOCAL_PAGES } from "@/content/localPages";
import { LocalAreaPageContent } from "@/components/LocalAreaPageContent";
import { getCategories } from "@/lib/base44/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

const content = LOCAL_PAGES.find((p) => p.path === "/electric-appliances-maalot")!;

export const revalidate = 1800;

export const metadata: Metadata = buildMetadata({
  title: content.metaTitle,
  description: content.metaDescription,
  path: content.path,
});

export default async function Page() {
  const categories = await getCategories();
  return <LocalAreaPageContent content={content} categories={categories} />;
}
