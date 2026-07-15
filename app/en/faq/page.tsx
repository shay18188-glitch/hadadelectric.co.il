import type { Metadata } from "next";
import { LocaleFaqPage } from "@/components/i18n/LocalePages";
import { EN_CONTENT } from "@/content/i18n/en";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: EN_CONTENT.faq.metaTitle,
  description: EN_CONTENT.faq.metaDescription,
  path: "/en/faq",
  locale: "en",
  translations: TRANSLATED_PATHS["/faq"],
});

export default function EnglishFaqPage() {
  return <LocaleFaqPage locale="en" content={EN_CONTENT} />;
}
