import type { FaqEntry } from "@/content/faq";

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {items.map((item) => (
        <details key={item.question} className="group p-5 open:bg-surface/40">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-graphite marker:content-none md:text-base">
            {item.question}
            <span aria-hidden="true" className="shrink-0 text-graphite-soft/60 transition-transform group-open:rotate-45">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-graphite-soft/90">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
