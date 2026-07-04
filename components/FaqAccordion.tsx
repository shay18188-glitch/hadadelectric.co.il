import type { FaqEntry } from "@/content/faq";

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {items.map((item) => (
        <details key={item.question} className="group open:bg-surface/40">
          <summary className="tap-target flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-graphite marker:content-none md:px-5 md:py-5 md:text-base">
            {item.question}
            <span aria-hidden="true" className="shrink-0 text-graphite-soft/60 transition-transform group-open:rotate-45">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </summary>
          <p className="px-4 pb-4 text-sm leading-relaxed text-graphite-soft/90 md:px-5 md:pb-5">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
