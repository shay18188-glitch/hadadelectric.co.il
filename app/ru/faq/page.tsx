import type { Metadata } from "next";
import { LocaleFaqPage } from "@/components/i18n/LocalePages";
import { RU_CONTENT } from "@/content/i18n/ru";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: RU_CONTENT.faq.metaTitle,
  description: RU_CONTENT.faq.metaDescription,
  path: "/ru/faq",
  locale: "ru",
  translations: TRANSLATED_PATHS["/faq"],
});

export default function RussianFaqPage() {
  return <LocaleFaqPage locale="ru" content={RU_CONTENT} />;
}
