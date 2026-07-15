import type { Metadata } from "next";
import { LocaleGuidesIndexPage } from "@/components/i18n/LocaleGuides";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

export const metadata: Metadata = buildMetadata({
  title: "Гиды по выбору бытовой техники — Hadad Electric",
  description:
    "Практичные гиды по выбору бытовой техники — холодильники, стиральные машины, телевизоры, кондиционеры и не только. Hadad Electric, Нагария.",
  path: "/ru/guides",
  locale: "ru",
  translations: TRANSLATED_PATHS["/guides"],
});

export default function RussianGuidesIndex() {
  return <LocaleGuidesIndexPage locale="ru" />;
}
