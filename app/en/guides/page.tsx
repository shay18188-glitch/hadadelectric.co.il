import type { Metadata } from "next";
import { LocaleGuidesIndexPage } from "@/components/i18n/LocaleGuides";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: "Appliance Buying Guides — Hadad Electric",
  description:
    "Practical guides for choosing home appliances — refrigerators, washing machines, TVs, air conditioners and more, from Hadad Electric in Nahariya.",
  path: "/en/guides",
  locale: "en",
  translations: TRANSLATED_PATHS["/guides"],
});

export default function EnglishGuidesIndex() {
  return <LocaleGuidesIndexPage locale="en" />;
}
