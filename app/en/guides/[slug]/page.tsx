import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDES, getGuideBySlug } from "@/content/guides";
import { LocaleGuidePage } from "@/components/i18n/LocaleGuides";
import { localizeGuide } from "@/lib/i18n/translated";
import { buildMetadata } from "@/lib/seo/metadata";
import { translationsForPath } from "@/lib/i18n/locales";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  const localized = localizeGuide(guide, "en");
  return buildMetadata({
    title: `${localized.title} — Hadad Electric`,
    description: localized.description,
    path: `/en/guides/${slug}`,
    locale: "en",
    translations: translationsForPath(`/guides/${slug}`) ?? undefined,
  });
}

export default async function EnglishGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();
  return <LocaleGuidePage guide={guide} locale="en" />;
}
