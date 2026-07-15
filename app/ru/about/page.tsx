import type { Metadata } from "next";
import { LocaleAboutPage } from "@/components/i18n/LocalePages";
import { RU_CONTENT } from "@/content/i18n/ru";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: RU_CONTENT.about.metaTitle,
  description: RU_CONTENT.about.metaDescription,
  path: "/ru/about",
  locale: "ru",
  translations: TRANSLATED_PATHS["/about"],
});

export default function RussianAboutPage() {
  return <LocaleAboutPage locale="ru" content={RU_CONTENT} />;
}
