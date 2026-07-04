"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomSheet } from "@/components/BottomSheet";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MOBILE_NAV_ICONS, NAV_LINKS } from "@/lib/nav";
import { cx } from "@/lib/utils";

export function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <BottomSheet open={open} onClose={onClose} placement="end" title="תפריט">
      <nav aria-label="ניווט נייד" className="px-3 pt-2">
        <ul className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={cx(
                    "tap-target flex items-center gap-3.5 rounded-2xl px-3.5 py-3.5 text-[15px] font-semibold transition-colors",
                    isActive ? "bg-surface text-brand-blue" : "text-graphite active:bg-surface"
                  )}
                >
                  <span
                    className={cx(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      isActive ? "bg-brand-blue text-white" : "bg-brand-blue-light text-brand-blue"
                    )}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]">
                      <path strokeLinecap="round" strokeLinejoin="round" d={MOBILE_NAV_ICONS[link.href]} />
                    </svg>
                  </span>
                  <span className="flex-1">{link.label}</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0 fill-none stroke-graphite-soft/40 stroke-2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 6 9 12l6 6" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-3 border-t border-line px-5 py-4">
        <p className="mb-2 text-xs font-semibold text-graphite-soft/60">שפה</p>
        <LanguageSwitcher />
      </div>
    </BottomSheet>
  );
}
