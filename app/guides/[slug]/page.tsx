import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDES, getGuideBySlug } from "@/content/guides";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { GuideCatalogCta } from "@/components/GuideCatalogCta";
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

  // CTA target: the related category catalog, or the full catalog as fallback.
  const ctaHref = relatedCategory ? `/categories/${relatedCategory.slug}` : "/products";
  const ctaCategoryName = relatedCategory?.name;

  // Split the article so a mid-content CTA can sit between two prose blocks
  // (outside SeoTextBlock, which styles descendant <p>/<h3>).
  const splitAt = Math.ceil(guide.sections.length / 2);
  const firstHalf = guide.sections.slice(0, splitAt);
  const secondHalf = guide.sections.slice(splitAt);

  return (
    <>
      <Breadcrumbs items={[{ name: "מדריכים", path: "/guides" }, { name: guide.title, path: `/guides/${slug}` }]} />

      <article className="container-page pb-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">{guide.title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-graphite-soft/80 md:mt-3 md:text-base">{guide.description}</p>

        {/* CTA #1 — top, right under the intro */}
        <div className="mt-5 max-w-3xl md:mt-6">
          <GuideCatalogCta
            href={ctaHref}
            variant="inline"
            label={ctaCategoryName ? `צפו במוצרי ${ctaCategoryName} בקטלוג` : "צפו בקטלוג המוצרים שלנו"}
          />
        </div>

        <div className="mt-6 max-w-3xl md:mt-8">
          <SeoTextBlock>
            {firstHalf.map((section, index) => (
              <div key={index}>
                {section.heading && <h3>{section.heading}</h3>}
                {section.paragraphs.map((p, pi) => (
                  <p key={pi}>{p}</p>
                ))}
              </div>
            ))}
          </SeoTextBlock>
        </div>

        {secondHalf.length > 0 && (
          <>
            {/* CTA #2 — mid-article, between the two prose halves */}
            <div className="mt-6 max-w-3xl">
              <GuideCatalogCta
                href={ctaHref}
                variant="inline"
                label={ctaCategoryName ? `לצפייה בדגמי ${ctaCategoryName} בקטלוג` : "לצפייה בכל המוצרים בקטלוג"}
              />
            </div>

            <div className="mt-6 max-w-3xl md:mt-8">
              <SeoTextBlock>
                {secondHalf.map((section, index) => (
                  <div key={index}>
                    {section.heading && <h3>{section.heading}</h3>}
                    {section.paragraphs.map((p, pi) => (
                      <p key={pi}>{p}</p>
                    ))}
                  </div>
                ))}
              </SeoTextBlock>
            </div>
          </>
        )}

        {guide.faq && guide.faq.length > 0 && (
          <section className="mt-10 max-w-3xl md:mt-12" aria-labelledby="guide-faq-heading">
            <h2 id="guide-faq-heading" className="text-lg font-bold text-graphite md:text-2xl">
              שאלות נפוצות
            </h2>
            <div className="mt-3 md:mt-4">
              <FaqAccordion items={guide.faq} />
            </div>
            <JsonLd data={faqJsonLd(guide.faq)} />
          </section>
        )}

        {/* CTA #3 — bottom banner, final push to the catalog */}
        <div className="max-w-3xl">
          <GuideCatalogCta
            href={ctaHref}
            variant="banner"
            categoryName={ctaCategoryName}
            label={ctaCategoryName ? `למוצרי ${ctaCategoryName}` : "לקטלוג המלא"}
          />
        </div>
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
