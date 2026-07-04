"use client";

import Link from "next/link";
import { useRequestBasket } from "@/components/RequestBasketProvider";
import { cx } from "@/lib/utils";

export function RequestBasketIcon({ className }: { className?: string }) {
  const { count } = useRequestBasket();

  return (
    <Link
      href="/request"
      aria-label={`הבקשה שלי, ${count} מוצרים`}
      className={cx(
        "relative inline-flex items-center justify-center rounded-full text-graphite transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10",
        className
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 fill-none stroke-current stroke-[1.8]">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 7h13l-1.5 9.5a2 2 0 0 1-2 1.7H8.9a2 2 0 0 1-2-1.7L5 4H3"
        />
        <circle cx="9.5" cy="20" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="17" cy="20" r="1.3" fill="currentColor" stroke="none" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-blue px-1 text-[11px] font-bold text-white"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
