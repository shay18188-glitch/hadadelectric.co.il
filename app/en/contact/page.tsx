import type { Metadata } from "next";
import { LocaleContactPage } from "@/components/i18n/LocalePages";
import { EN_CONTENT } from "@/content/i18n/en";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: EN_CONTENT.contact.metaTitle,
  description: EN_CONTENT.contact.metaDescription,
  path: "/en/contact",
  locale: "en",
  translations: TRANSLATED_PATHS["/contact"],
});

export default function EnglishContactPage() {
  return <LocaleContactPage locale="en" content={EN_CONTENT} />;
}
