import type { Metadata } from "next";
import { getCategories } from "@/lib/base44/catalog";
import { LocaleCategoriesIndexPage } from "@/components/i18n/LocaleCategory";
import { generateLocaleCategoriesIndexMetadata } from "@/lib/seo/metadata";

export const revalidate = 10800; // 3 hours

export const metadata: Metadata = generateLocaleCategoriesIndexMetadata("ru");

export default async function Page() {
  const categories = await getCategories();
  return <LocaleCategoriesIndexPage locale="ru" categories={categories} />;
}
