import { GOOGLE_REVIEWS } from "@/content/reviews";
import { cx } from "@/lib/utils";

/** The four-colour Google "G" mark, for attribution ("reviews on Google"). */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17Z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7A21.99 21.99 0 0 0 24 46Z" />
      <path fill="#FBBC05" d="M11.69 28.18A13.2 13.2 0 0 1 11 24c0-1.45.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7Z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07Z" />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span className="relative inline-block leading-none" style={{ direction: "ltr" }} aria-hidden="true">
      <span className="text-[18px] tracking-[2px] text-[#dfe3ea]">★★★★★</span>
      <span
        className="absolute inset-0 overflow-hidden text-[18px] tracking-[2px] text-[#fbbc04]"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

/**
 * Visual Google rating badge (score only, real numbers, links to the genuine
 * reviews). No aggregateRating structured data by design — see content/reviews.ts.
 */
export function GoogleRating({
  variant = "card",
  className,
}: {
  variant?: "card" | "inline";
  className?: string;
}) {
  const { rating, count, url } = GOOGLE_REVIEWS;
  const label = `דירוג ${rating} מתוך 5 מבוסס על ${count} ביקורות בגוגל`;

  if (variant === "inline") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={cx(
          "inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm text-graphite transition-colors hover:border-brand-blue/40",
          className
        )}
      >
        <GoogleG className="h-4 w-4 shrink-0" />
        <span className="font-bold">{rating}</span>
        <Stars rating={rating} />
        <span className="text-graphite-soft/70">({count})</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cx(
        "group flex items-center gap-4 rounded-2xl border border-line bg-white px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-brand-blue/30 hover:shadow-md md:px-6 md:py-5",
        className
      )}
    >
      <GoogleG className="h-9 w-9 shrink-0 md:h-10 md:w-10" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold leading-none text-graphite md:text-[26px]">{rating}</span>
          <Stars rating={rating} />
        </div>
        <p className="mt-1 text-sm text-graphite-soft/80">
          מתוך 5 · {count} ביקורות ב-Google
        </p>
      </div>
      <span className="ms-auto hidden shrink-0 text-sm font-semibold text-brand-blue group-hover:underline sm:inline">
        קראו ביקורות ←
      </span>
    </a>
  );
}
