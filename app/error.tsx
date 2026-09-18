"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BUSINESS } from "@/lib/utils";

/**
 * Route-level error boundary.
 *
 * Without one, a throw anywhere in a page — a malformed feed record reaching
 * a component, a client hook failing on an old browser — takes the whole
 * route to Next's blank fallback, and a shopper sees nothing at all. The two
 * things this shop can never afford to lose are the phone number and a way
 * back into the catalog, so those are exactly what the failure state keeps.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Vercel collects this; the digest is what ties it to the server trace.
    console.error("[route-error]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div className="container-page py-20 md:py-28">
      <div className="surface-card mx-auto max-w-xl rounded-[2rem] p-7 text-center md:p-10">
        <p className="section-kicker justify-center">שגיאה זמנית</p>
        <h1 className="heading-balance mt-3 text-2xl font-black text-graphite md:text-3xl">
          משהו השתבש בטעינת העמוד
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-graphite-soft/80">
          התקלה אצלנו, לא אצלכם. אפשר לנסות לטעון מחדש, לחזור לקטלוג, או פשוט להתקשר —
          נשמח לעזור למצוא את המוצר בטלפון.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-brand-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-blue-dark"
          >
            נסו שוב
          </button>
          <Link
            href="/products"
            className="rounded-full border border-line bg-white px-6 py-3 text-sm font-bold text-graphite transition hover:bg-surface"
          >
            חזרה לקטלוג
          </Link>
          <a
            href={BUSINESS.phoneHref}
            className="rounded-full border border-line bg-white px-6 py-3 text-sm font-bold text-graphite transition hover:bg-surface"
          >
            {BUSINESS.phoneDisplay}
          </a>
        </div>
      </div>
    </div>
  );
}
