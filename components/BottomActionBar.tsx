import type { ReactNode } from "react";
import { cx } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locales";

/**
 * Shared look for the mobile bottom bars (global + product page). It mirrors
 * the floating mobile header — the same frosted white card, line border and
 * soft navy shadow — so the page is framed by one pair of matching bars:
 * a wide brand-blue primary and two compact secondary actions.
 */
export const BAR_SPACER_CLASS = "h-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:hidden";

/** Label sizes per language: Russian and English labels run longer than Hebrew. */
export const BAR_TEXT_SIZE: Record<Locale, { primary: string; secondary: string }> = {
  he: { primary: "text-[16px] tracking-[-0.01em]", secondary: "text-[12px]" },
  en: { primary: "text-[15px]", secondary: "text-[12px]" },
  ru: { primary: "text-[14px]", secondary: "text-[11.5px]" },
};

export const BAR_SECONDARY_CLASS =
  "tap-scale flex w-[3.75rem] shrink-0 flex-col items-center justify-center gap-1 rounded-[0.95rem] bg-surface/75 font-bold leading-none text-graphite ring-1 ring-inset ring-line/50 transition-colors active:bg-brand-blue-light min-[360px]:w-[4.25rem] min-[380px]:w-[4.6rem]";

/** The primary's icon steps aside on phones under 360px so its label is never cut. */
export const BAR_PRIMARY_ICON_CLASS = "hidden min-[360px]:block";

export const BAR_PRIMARY_BASE_CLASS =
  "tap-scale flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[0.95rem] px-2 font-extrabold min-[360px]:px-3 leading-none text-white transition-colors";

export const BAR_PRIMARY_CLASS = `${BAR_PRIMARY_BASE_CLASS} bg-gradient-to-b from-brand-blue to-brand-blue-dark shadow-[0_12px_26px_-16px_rgba(11,87,147,0.95)] active:from-brand-blue-dark`;

export function BottomActionBarShell({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-2 md:hidden">
      <nav
        aria-label={label}
        className="pointer-events-auto mx-auto flex h-[4.25rem] max-w-md items-stretch gap-1.5 rounded-[1.35rem] border border-line/70 bg-white/92 p-1.5 shadow-[0_16px_45px_-20px_rgba(10,22,36,0.42)] backdrop-blur-2xl"
      >
        {children}
      </nav>
    </div>
  );
}

export function BarIcon({ name, className }: { name: "whatsapp" | "phone" | "search" | "basket" | "check"; className?: string }) {
  const base = cx("h-5 w-5 shrink-0", className);
  switch (name) {
    case "whatsapp":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={cx(base, "fill-current text-[#1faa53]")}>
          <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38A9.94 9.94 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.2c-1.6 0-3.15-.43-4.5-1.24l-.32-.19-3.12.82.83-3.04-.21-.32A8.18 8.18 0 0 1 3.8 12c0-4.55 3.7-8.24 8.24-8.24 4.55 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.2-8.24 8.2Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.12-.56.12-.17.25-.64.8-.79.96-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.15-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.41 1.02 2.58.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
        </svg>
      );
    case "phone":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={cx(base, "fill-current")}>
          <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
        </svg>
      );
    case "search":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={cx(base, "fill-none stroke-current stroke-[2.2]")}>
          <circle cx="11" cy="11" r="6.5" />
          <path strokeLinecap="round" d="m20 20-4-4" />
        </svg>
      );
    case "basket":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={cx(base, "fill-none stroke-current stroke-2")}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h13l-1.5 9.5a2 2 0 0 1-2 1.7H8.9a2 2 0 0 1-2-1.7L5 4H3M12 9v6M9 12h6" />
        </svg>
      );
    case "check":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={cx(base, "fill-none stroke-current stroke-[2.4]")}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      );
  }
}
