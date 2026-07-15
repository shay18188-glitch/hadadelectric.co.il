import type { Metadata } from "next";
import { LocaleDeliveryPage } from "@/components/i18n/LocalePages";
import { RU_CONTENT } from "@/content/i18n/ru";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: RU_CONTENT.delivery.metaTitle,
  description: RU_CONTENT.delivery.metaDescription,
  path: "/ru/delivery",
  locale: "ru",
  translations: TRANSLATED_PATHS["/services/delivery"],
});

export default function RussianDeliveryPage() {
  return <LocaleDeliveryPage locale="ru" content={RU_CONTENT} />;
}
