import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GUIDES } from "@/content/guides";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "מדריכים למוצרי חשמל",
  description: "מדריכים מעשיים לבחירת מוצרי חשמל לבית — מקררים, מכונות כביסה, טלוויזיות, מזגנים ועוד.",
  path: "/guides",
});

export default function GuidesIndexPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "מדריכים", path: "/guides" }]} />
      <div className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">מדריכים למוצרי חשמל</h1>
        <p className="mt-3 max-w-2xl text-sm text-graphite-soft/80 md:text-base">
          טיפים מעשיים שיעזרו לכם לבחור את מוצר החשמל המתאים לבית שלכם.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="flex flex-col rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-graphite">{guide.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-graphite-soft/80">{guide.description}</p>
              <span className="mt-4 text-sm font-semibold text-brand-blue">קראו עוד ←</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
