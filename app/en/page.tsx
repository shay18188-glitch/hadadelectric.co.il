import type { Metadata } from "next";
import { LocaleHomePage } from "@/components/i18n/LocalePages";
import { EN_CONTENT } from "@/content/i18n/en";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: EN_CONTENT.home.metaTitle,
  description: EN_CONTENT.home.metaDescription,
  path: "/en",
  locale: "en",
  translations: TRANSLATED_PATHS["/"],
});

export default function EnglishHomePage() {
  return <LocaleHomePage locale="en" content={EN_CONTENT} />;
}
