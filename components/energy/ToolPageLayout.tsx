import type { ReactNode } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SeoTextBlock } from "@/components/SeoTextBlock";
import { faqJsonLd } from "@/lib/schema/jsonld";
import { getGuideBySlug } from "@/content/guides";
import { ENERGY_TOOLS, type EnergyTool } from "@/content/energyTools";
import { KAMAYOTZE, TARIFF_AGOROT_INC_VAT, TARIFF_FROM_HE, TARIFF_SOURCE_URL } from "@/lib/energy/tariff";
import { absoluteUrl } from "@/lib/utils";

/**
 * The frame every electricity calculator sits in.
 *
 * The calculator is the reason for the visit; what the frame adds is the
 * answer in words (for the snippet and for answer engines), the method, and
 * three onward routes — the guide on the same question, the catalog, and the
 * general calculator on kamayotze.co.il for the parts this one leaves out.
 */

export function ToolPageLayout({
  tool,
  heading,
  intro,
  answer,
  method,
  faq,
  children,
}: {
  tool: EnergyTool;
  heading: string;
  intro: ReactNode;
  /** One-sentence answer, shown above the calculator. */
  answer: string;
  method: { heading: string; paragraphs: string[] }[];
  faq: { question: string; answer: string }[];
  children: ReactNode;
}) {
  const guides = tool.guideSlugs
    .map((slug) => getGuideBySlug(slug))
    .filter((guide): guide is NonNullable<typeof guide> => Boolean(guide));
  const otherTools = ENERGY_TOOLS.filter((t) => t.path !== tool.path);

  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: tool.title,
          description: tool.short,
          url: absoluteUrl(tool.path),
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          inLanguage: "he",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "ILS" },
        }}
      />
      <Breadcrumbs items={[{ name: "מחשבונים", path: "/tools" }, { name: tool.title, path: tool.path }]} />
      <div className="container-page pb-12 md:pb-16">
        <div className="page-intro-shell">
          <p className="section-kicker">מחשבון חשמל · {tool.kicker}</p>
          <h1 className="heading-balance mt-2 text-3xl font-black leading-[1.08] tracking-[-0.035em] text-graphite md:text-5xl">
            {heading}
          </h1>
          <div className="mt-4 max-w-3xl text-[15px] leading-relaxed text-graphite-soft/85 md:text-base">{intro}</div>
          <div className="mt-5 max-w-3xl rounded-[1.25rem] border border-brand-blue/20 bg-brand-blue-light p-4 md:p-5">
            <p className="text-xs font-bold text-brand-blue">התשובה הקצרה</p>
            <p className="mt-1.5 text-base font-semibold leading-relaxed text-graphite">{answer}</p>
          </div>
        </div>

        {children}

        <section className="mt-12 grid gap-6 md:mt-16 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start" aria-label="איך מחשבים">
          <div className="surface-card min-w-0 rounded-[1.75rem] p-6 sm:p-8">
            <SeoTextBlock>
              {method.map((section) => (
                <section key={section.heading} className="border-b border-line/65 pb-6 last:border-0 last:pb-0">
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </section>
              ))}
            </SeoTextBlock>
            <p className="mt-5 text-xs leading-relaxed text-graphite-soft/60">
              התעריף: {TARIFF_AGOROT_INC_VAT} אג׳ לקוט״ש כולל מע״מ, התעריף הביתי של{" "}
              <a href={TARIFF_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-blue">
                רשות החשמל
              </a>{" "}
              מ־{TARIFF_FROM_HE}. החישוב מתבצע בדפדפן שלכם, והערכים שאתם מזינים לא נשלחים לשום מקום. התוצאה היא הערכה, לא הצעת מחיר.
            </p>
          </div>

          <aside className="rounded-[1.75rem] border border-line/75 bg-white p-6 shadow-[0_24px_65px_-45px_rgba(10,22,36,0.6)]" aria-labelledby="kamayotze-heading">
            <p className="section-kicker">חישוב מפורט יותר</p>
            <h2 id="kamayotze-heading" className="mt-2 text-lg font-black leading-tight text-graphite">
              המחשבונים המלאים באתר ״כמה יוצא״
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {tool.kamayotze.map((key) => (
                <li key={key}>
                  {/* Plain followed links on purpose: a recommendation of a sibling site. */}
                  <a href={KAMAYOTZE[key].href} className="block rounded-2xl border border-line p-3.5 transition-colors hover:border-brand-blue/40">
                    <span className="block text-sm font-bold text-brand-blue">{KAMAYOTZE[key].label} ←</span>
                    <span className="mt-1 block text-xs leading-relaxed text-graphite-soft/70">{KAMAYOTZE[key].description}</span>
                  </a>
                </li>
              ))}
            </ul>
            <a href={KAMAYOTZE.carHome.href} className="mt-3 inline-block text-xs font-semibold text-graphite-soft/70 hover:text-brand-blue hover:underline">
              כל מחשבוני הבית והאנרגיה ב״כמה יוצא״
            </a>
          </aside>
        </section>

        <section className="mt-10 md:mt-14" aria-labelledby="tool-faq-heading">
          <h2 id="tool-faq-heading" className="text-xl font-black text-graphite md:text-2xl">
            שאלות נפוצות
          </h2>
          <dl className="mt-4 flex flex-col gap-3">
            {faq.map((item) => (
              <div key={item.question} className="rounded-2xl border border-line bg-white px-4 py-3.5">
                <dt className="text-sm font-bold text-graphite">{item.question}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-graphite-soft/85">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        {guides.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="tool-guides-heading">
            <h2 id="tool-guides-heading" className="text-lg font-bold text-graphite md:text-2xl">
              להמשך קריאה
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="block h-full rounded-2xl border border-line bg-white p-4 transition-colors hover:border-brand-blue/40 md:p-5"
                  >
                    <span className="block text-sm font-bold text-graphite">{guide.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-graphite-soft/70">{guide.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 md:mt-14" aria-labelledby="tool-more-heading">
          <h2 id="tool-more-heading" className="text-lg font-bold text-graphite md:text-2xl">
            מחשבונים נוספים
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {otherTools.map((other) => (
              <li key={other.path}>
                <Link
                  href={other.path}
                  className="block h-full rounded-2xl border border-line bg-white p-4 text-sm font-semibold text-graphite transition-colors hover:border-brand-blue/40 hover:text-brand-blue"
                >
                  {other.title} ←
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/tools/niche-fit"
                className="block h-full rounded-2xl border border-line bg-white p-4 text-sm font-semibold text-graphite transition-colors hover:border-brand-blue/40 hover:text-brand-blue"
              >
                מחשבון התאמת נישה — מה נכנס במידות ←
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
