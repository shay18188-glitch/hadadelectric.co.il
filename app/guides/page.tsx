import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { GUIDES } from "@/content/guides";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";
import { categoryImageFor } from "@/lib/categoryVisuals";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = buildMetadata({
  title: "מדריכים למוצרי חשמל",
  description: "מדריכים מעשיים לבחירת מוצרי חשמל לבית — מקררים, מכונות כביסה, טלוויזיות, מזגנים ועוד.",
  path: "/guides",
  translations: TRANSLATED_PATHS["/guides"],
});

export default function GuidesIndexPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "מדריכים", path: "/guides" }]} />
      <div className="container-page pb-12 md:pb-16">
        <PageHero
          eyebrow="ידע מקצועי לפני שבוחרים"
          title="מדריכים למוצרי חשמל"
          description="טיפים מעשיים, בדיקות חשובות והשוואות ברורות שיעזרו לכם לבחור את מוצר החשמל המתאים לבית — לפני שמחליטים על דגם."
          imageSrc="/images/redesign/category-small-appliances.png"
          imageAlt="מכונת קפה, קומקום ומיקסר במטבח מודרני"
          imageClassName="object-[56%_center] md:object-center"
          badges={
            <>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">{GUIDES.length} מדריכים מעשיים</span>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">מידות, תשתיות והתאמה</span>
              <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2.5 backdrop-blur-md">קישורים ישירים לדגמים</span>
            </>
          }
        />

        <Reveal as="div" stagger className="mt-9 grid gap-6 sm:grid-cols-2 md:mt-12 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="tap-scale group flex flex-col overflow-hidden rounded-[1.6rem] border border-line/80 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image src={categoryImageFor(guide.relatedCategorySlug ?? guide.catalogCategorySlugs?.[0] ?? "small-appliances")} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-6 md:p-7">
                <p className="section-kicker !text-[.8rem]">המדריך שלנו</p>
                <h2 className="mt-3 text-xl font-black leading-snug text-graphite md:text-2xl">{guide.title}</h2>
                <p className="mt-3 line-clamp-3 text-base leading-7 text-graphite-soft/75">{guide.description}</p>
                <span className="mt-auto pt-6 text-base font-bold text-brand-blue">לקריאת המדריך ←</span>
              </div>
            </Link>
          ))}
        </Reveal>
      </div>
    </>
  );
}
