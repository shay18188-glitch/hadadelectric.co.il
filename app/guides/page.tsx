import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { GUIDES } from "@/content/guides";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";
import { categoryImageFor } from "@/lib/categoryVisuals";

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
        <div className="page-intro-shell">
          <p className="section-kicker">ידע מקצועי לפני שבוחרים</p>
          <h1 className="mt-3">מדריכים למוצרי חשמל</h1>
          <p className="mt-4 max-w-2xl text-sm text-graphite-soft/80 md:text-base">טיפים מעשיים שיעזרו לכם לבחור את מוצר החשמל המתאים לבית שלכם.</p>
        </div>

        <Reveal as="div" stagger className="mt-7 grid gap-5 sm:grid-cols-2 md:mt-10 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="tap-scale group flex flex-col overflow-hidden rounded-[1.6rem] border border-line/80 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image src={categoryImageFor(guide.relatedCategorySlug ?? guide.catalogCategorySlugs?.[0] ?? "small-appliances")} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-5 md:p-6">
                <p className="section-kicker">המדריך שלנו</p>
                <h2 className="mt-2 text-base font-black leading-snug text-graphite md:text-lg">{guide.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-graphite-soft/75">{guide.description}</p>
                <span className="mt-auto pt-5 text-sm font-bold text-brand-blue">לקריאת המדריך ←</span>
              </div>
            </Link>
          ))}
        </Reveal>
      </div>
    </>
  );
}
