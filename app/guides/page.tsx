import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { GUIDES } from "@/content/guides";
import { buildMetadata } from "@/lib/seo/metadata";
import { TRANSLATED_PATHS } from "@/lib/i18n/locales";

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
        <h1 className="text-xl font-bold text-graphite md:text-4xl">מדריכים למוצרי חשמל</h1>
        <p className="mt-2 max-w-2xl text-sm text-graphite-soft/80 md:mt-3 md:text-base">
          טיפים מעשיים שיעזרו לכם לבחור את מוצר החשמל המתאים לבית שלכם.
        </p>

        <Reveal as="div" stagger className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5 md:mt-8 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="tap-scale flex flex-col rounded-2xl border border-line bg-white p-5 transition-shadow md:p-6 md:hover:shadow-md"
            >
              <h2 className="text-base font-bold text-graphite md:text-lg">{guide.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-graphite-soft/80">{guide.description}</p>
              <span className="mt-4 text-sm font-semibold text-brand-blue">קראו עוד ←</span>
            </Link>
          ))}
        </Reveal>
      </div>
    </>
  );
}
