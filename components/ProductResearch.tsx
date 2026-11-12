import type { PublishedResearch } from "@/lib/research/schema";
import { FaqAccordion } from "@/components/FaqAccordion";

/**
 * The sections a researched product page adds.
 *
 * Every string here comes from `content/productResearch.json`, which holds
 * only facts that passed the research gate (verified, exact-model source,
 * independent QA). Nothing is filled in when a list is empty — a missing
 * "in the box" section is more honest than a guessed one.
 */

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 ${className}`}>
      <path d="M5 10.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Short verified facts under the product paragraph, in the buy column. */
export function ProductHighlights({ research }: { research: PublishedResearch }) {
  if (research.highlights.length === 0) return null;
  return (
    <ul className="mt-4 grid gap-2 text-sm text-graphite" aria-label="עיקרי המפרט">
      {research.highlights.map((item) => (
        <li key={item} className="flex items-start gap-2 leading-relaxed">
          <CheckIcon className="mt-0.5 text-brand-blue" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** The full spec sheet, split into the fixed groups, with a jump list. */
export function GroupedSpecs({ research, modelNumber }: { research: PublishedResearch; modelNumber: string }) {
  const groups = research.specGroups;
  if (groups.length === 0) return null;
  return (
    <section className="mt-12 md:mt-16" aria-labelledby="specs-heading">
      <p className="section-kicker">כל הפרטים</p>
      <h2 id="specs-heading" className="mt-2 text-2xl font-black text-graphite md:text-3xl">
        מפרט טכני מלא — {modelNumber}
      </h2>

      {groups.length > 2 && (
        <nav aria-label="קפיצה לחלק במפרט" className="-mx-4 mt-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex gap-2 whitespace-nowrap pb-1 md:flex-wrap md:whitespace-normal">
            {groups.map((group) => (
              <li key={group.id}>
                <a
                  href={`#spec-${group.id}`}
                  className="inline-block rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-graphite-soft transition hover:border-brand-blue hover:text-brand-blue md:text-[13px]"
                >
                  {group.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-5 gap-5 lg:columns-2">
        {groups.map((group) => (
          <section
            key={group.id}
            id={`spec-${group.id}`}
            aria-labelledby={`spec-${group.id}-heading`}
            className="surface-card mb-5 scroll-mt-28 break-inside-avoid overflow-hidden rounded-[1.25rem]"
          >
            <h3 id={`spec-${group.id}-heading`} className="border-b border-line bg-surface/70 px-4 py-3 text-sm font-bold text-graphite md:text-base">
              {group.title}
            </h3>
            <table className="w-full text-[13px] md:text-sm">
              <tbody>
                {group.rows.map((row, index) => (
                  <tr key={`${row.label}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-surface/50"}>
                    <th scope="row" className="w-[42%] px-4 py-2.5 text-start align-top font-medium text-graphite-soft/75">
                      {row.label}
                    </th>
                    <td dir="auto" className="px-4 py-2.5 text-right align-top text-graphite">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </section>
  );
}

function ListCard({ title, items, tone = "plain" }: { title: string; items: string[]; tone?: "plain" | "note" }) {
  if (items.length === 0) return null;
  return (
    <section className={`rounded-[1.5rem] border p-5 md:p-7 ${tone === "note" ? "border-brand-gold/40 bg-brand-gold/5" : "border-line bg-white"}`}>
      <h2 className="text-lg font-black text-graphite md:text-xl">{title}</h2>
      <ul className="mt-4 grid gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-graphite-soft/90">
            <span aria-hidden="true" className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "note" ? "bg-brand-gold" : "bg-brand-blue"}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Who the model suits, and what to check before ordering. */
export function FitAndConsiderations({ research }: { research: PublishedResearch }) {
  if (research.goodFor.length === 0 && research.considerations.length === 0) return null;
  return (
    <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-5">
      <ListCard title="למי הדגם מתאים" items={research.goodFor} />
      <ListCard title="חשוב לבדוק לפני ההזמנה" items={research.considerations} tone="note" />
    </div>
  );
}

/** Box contents and installation requirements, from the manual or importer. */
export function BoxAndInstallation({ research }: { research: PublishedResearch }) {
  if (research.inTheBox.length === 0 && research.installation.length === 0) return null;
  return (
    <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-5">
      <ListCard title="מה באריזה" items={research.inTheBox} />
      <ListCard title="התקנה ודרישות" items={research.installation} />
    </div>
  );
}

export function ProductFaq({ research, modelNumber }: { research: PublishedResearch; modelNumber: string }) {
  if (research.faq.length === 0) return null;
  return (
    <section className="mt-10 md:mt-14" aria-labelledby="product-faq-heading">
      <h2 id="product-faq-heading" className="text-lg font-bold text-graphite md:text-2xl">
        שאלות נפוצות על {modelNumber}
      </h2>
      <div className="mt-4">
        <FaqAccordion items={research.faq.map((f) => ({ question: f.q, answer: f.a }))} />
      </div>
    </section>
  );
}
