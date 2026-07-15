import type { Metadata } from "next";
import { LocaleDeliveryPage } from "@/components/i18n/LocalePages";
import { EN_CONTENT } from "@/content/i18n/en";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: EN_CONTENT.delivery.metaTitle,
  description: EN_CONTENT.delivery.metaDescription,
  path: "/en/delivery",
  locale: "en",
  translations: TRANSLATED_PATHS["/services/delivery"],
});

export default function EnglishDeliveryPage() {
  return <LocaleDeliveryPage locale="en" content={EN_CONTENT} />;
}
