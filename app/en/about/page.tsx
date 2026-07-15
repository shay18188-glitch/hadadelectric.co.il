import type { Metadata } from "next";
import { LocaleAboutPage } from "@/components/i18n/LocalePages";
import { EN_CONTENT } from "@/content/i18n/en";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: EN_CONTENT.about.metaTitle,
  description: EN_CONTENT.about.metaDescription,
  path: "/en/about",
  locale: "en",
  translations: TRANSLATED_PATHS["/about"],
});

export default function EnglishAboutPage() {
  return <LocaleAboutPage locale="en" content={EN_CONTENT} />;
}
