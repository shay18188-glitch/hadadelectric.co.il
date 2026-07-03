import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GUIDES, getGuideBySlug } from "@/content/guides";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { articleJsonLd, faqJsonLd } from "@/lib/schema/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoryBySlug } from "@/lib/base44/catalog";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  return buildMetadata({ title: guide.title, description: guide.description, path: `/guides/${slug}` });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const relatedCategory = guide.relatedCategorySlug ? await getCategoryBySlug(guide.relatedCategorySlug) : null;

  return (
    <>
      <Breadcrumbs items={[{ name: "מדריכים", path: "/guides" }, { name: guide.title, path: `/guides/${slug}` }]} />

      <article className="container-page pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">{guide.title}</h1>
        <p className="mt-3 max-w-2xl text-base text-graphite-soft/80">{guide.description}</p>

        <div className="mt-8 max-w-3xl">
          <SeoTextBlock>
            {guide.sections.map((section, index) => (
              <div key={index}>
                {section.heading && <h3>{section.heading}</h3>}
                {section.paragraphs.map((p, pi) => (
                  <p key={pi}>{p}</p>
                ))}
              </div>
            ))}
          </SeoTextBlock>
        </div>

        {relatedCategory && (
          <div className="mt-8 rounded-2xl border border-line bg-brand-blue-light p-5">
            <p className="text-sm text-graphite">
              רוצים לעיין בקטלוג?{" "}
              <Link href={`/categories/${relatedCategory.slug}`} className="font-semibold text-brand-blue hover:underline">
                צפו במוצרי {relatedCategory.name} שלנו
              </Link>
            </p>
          </div>
        )}

        {guide.faq && guide.faq.length > 0 && (
          <section className="mt-12 max-w-3xl" aria-labelledby="guide-faq-heading">
            <h2 id="guide-faq-heading" className="text-xl font-bold text-graphite md:text-2xl">
              שאלות נפוצות
            </h2>
            <div className="mt-4">
              <FaqAccordion items={guide.faq} />
            </div>
            <JsonLd data={faqJsonLd(guide.faq)} />
          </section>
        )}
      </article>

      <JsonLd
        data={articleJsonLd({
          title: guide.title,
          description: guide.description,
          path: `/guides/${slug}`,
          datePublished: guide.publishedDate,
        })}
      />
    </>
  );
}
