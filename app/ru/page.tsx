import type { Metadata } from "next";
import { LocaleHomePage } from "@/components/i18n/LocalePages";
import { RU_CONTENT } from "@/content/i18n/ru";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: RU_CONTENT.home.metaTitle,
  description: RU_CONTENT.home.metaDescription,
  path: "/ru",
  locale: "ru",
  translations: TRANSLATED_PATHS["/"],
});

export default function RussianHomePage() {
  return <LocaleHomePage locale="ru" content={RU_CONTENT} />;
}
