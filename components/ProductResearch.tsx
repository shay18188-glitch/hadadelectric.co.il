import type { PublishedResearch } from "@/lib/research/schema";
import { FaqAccordion } from "@/components/FaqAccordion";

/**
 * The sections a researched product page adds.
 *
 * The spec groups, box contents and installation notes render as folding
 * rows in `ProductMoreDetails`; this file keeps the sections that stay open.
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
