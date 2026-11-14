import type { ReactNode } from "react";
import type { KeyFact } from "@/lib/productLayout";
import type { SpecEntry } from "@/types/product";

/**
 * The product page's two reading speeds.
 *
 * `KeyFacts` is the handful of numbers a buyer compares on, beside the
 * photo. `DetailRows` is everything else, each topic a row that opens on
 * click — native <details>, so it works without JavaScript and the folded
 * text is still in the HTML that search engines read.
 */

export function KeyFacts({ facts, className = "", ariaLabel }: { facts: KeyFact[]; className?: string; ariaLabel: string }) {
  if (facts.length === 0) return null;
  return (
    <dl aria-label={ariaLabel} className={`grid grid-cols-2 gap-2.5 text-sm xl:grid-cols-3 ${className}`}>
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-xl bg-surface/80 px-3.5 py-3">
          <dt className="line-clamp-2 text-xs leading-snug text-graphite-soft/65">{fact.label}</dt>
          <dd dir="auto" className="mt-0.5 line-clamp-2 text-right font-semibold leading-snug text-graphite">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailRows({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`surface-card divide-y divide-line overflow-hidden rounded-[1.5rem] ${className}`}>{children}</div>;
}

export function DetailRow({
  id,
  title,
  preview,
  defaultOpen = false,
  children,
}: {
  id?: string;
  title: string;
  /** A few words of what is inside, so a closed row still says what it holds. */
  preview?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details id={id} open={defaultOpen} className="group scroll-mt-28 open:bg-surface/30">
      <summary className="tap-target flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:content-none md:px-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <h3 className="text-sm font-bold text-graphite md:text-base">{title}</h3>
          {preview && (
            <span className="mt-0.5 block truncate text-xs text-graphite-soft/60 group-open:hidden">{preview}</span>
          )}
        </span>
        <span aria-hidden="true" className="shrink-0 text-graphite-soft/60 transition-transform group-open:rotate-180">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="px-2 pb-3 md:px-3 md:pb-4">{children}</div>
    </details>
  );
}

export function SpecTable({ rows }: { rows: SpecEntry[] }) {
  return (
    <table className="w-full overflow-hidden rounded-xl text-[13px] md:text-sm">
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.label}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-surface/60"}>
            {row.label ? (
              <>
                <th scope="row" className="w-[42%] px-3 py-2.5 text-start align-top font-medium text-graphite-soft/75 md:px-4">
                  {row.label}
                </th>
                <td dir="auto" className="px-3 py-2.5 text-right align-top text-graphite md:px-4">
                  {row.value}
                </td>
              </>
            ) : (
              <td colSpan={2} className="px-3 py-2.5 text-graphite md:px-4">
                {row.value}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2.5 px-2 py-1 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-graphite-soft/90">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** First few labels of a list, as the closed row's hint. */
export function previewOf(items: string[], more = "ועוד", max = 3): string {
  const shown = items.filter(Boolean).slice(0, max);
  return shown.join(" · ") + (items.length > max ? ` ${more}` : "");
}
