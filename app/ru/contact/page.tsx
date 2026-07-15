import type { Metadata } from "next";
import { LocaleContactPage } from "@/components/i18n/LocalePages";
import { RU_CONTENT } from "@/content/i18n/ru";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: RU_CONTENT.contact.metaTitle,
  description: RU_CONTENT.contact.metaDescription,
  path: "/ru/contact",
  locale: "ru",
  translations: TRANSLATED_PATHS["/contact"],
});

export default function RussianContactPage() {
  return <LocaleContactPage locale="ru" content={RU_CONTENT} />;
}
