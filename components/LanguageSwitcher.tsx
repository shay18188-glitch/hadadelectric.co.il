"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils";
import {
  LOCALES,
  LOCALE_LABEL,
  LOCALE_HTML_LANG,
  getLocaleFromPathname,
  switcherTargets,
} from "@/lib/i18n/locales";
import { CHROME } from "@/lib/i18n/chrome";

const MENU_WIDTH = 152; // px, matches min-w-[9.5rem]

/**
 * The menu is rendered in a portal on document.body: the header shell uses
 * overflow-hidden + backdrop-blur, which both clips absolutely-positioned
 * children and (via filter) becomes their containing block — an in-place
 * dropdown gets cut off. The portal escapes that entirely.
 */
export function LanguageSwitcher({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const pathname = usePathname();

  const locale = getLocaleFromPathname(pathname);
  const targets = switcherTargets(pathname);
  const dict = CHROME[locale];

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    // Clamp horizontally so the menu never leaves the viewport (RTL or LTR).
    const left = Math.min(Math.max(8, rect.left + rect.width / 2 - MENU_WIDTH / 2), window.innerWidth - MENU_WIDTH - 8);
    setPos({ top: rect.bottom + 6, left });
  }, []);

  function toggle() {
    if (!open) updatePosition();
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function handleReposition() {
      updatePosition();
    }
    // Menu links close via onClick; this covers back/forward navigation.
    function handleClose() {
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("popstate", handleClose);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("popstate", handleClose);
    };
  }, [open, updatePosition]);

  return (
    <div className={cx("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={dict.header.chooseLanguage}
        onClick={toggle}
        className={cx(
          "flex items-center justify-center rounded-full text-graphite transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue",
          open ? "bg-surface" : "hover:bg-surface",
          iconOnly ? "h-10 w-10 p-0" : "h-10 gap-1.5 px-2 text-sm font-medium md:px-3"
        )}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className={cx("shrink-0 fill-none stroke-current stroke-[1.6]", iconOnly ? "h-5 w-5 sm:h-6 sm:w-6" : "h-5 w-5")}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9Z" />
        </svg>
        {!iconOnly && <span className="hidden sm:inline-block">{LOCALE_LABEL[locale]}</span>}
      </button>

      {open && pos &&
        createPortal(
          <ul
            ref={menuRef}
            role="menu"
            aria-label={dict.header.chooseLanguage}
            dir="ltr"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="z-[100] rounded-xl border border-line bg-white p-1 shadow-lg"
          >
            {LOCALES.map((code) => {
              const isCurrent = code === locale;
              return (
                <li key={code} role="none">
                  <Link
                    role="menuitem"
                    href={targets[code]}
                    lang={LOCALE_HTML_LANG[code]}
                    aria-current={isCurrent ? "true" : undefined}
                    onClick={() => setOpen(false)}
                    className={cx(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                      isCurrent ? "bg-surface font-semibold text-graphite" : "text-graphite hover:bg-surface"
                    )}
                  >
                    {LOCALE_LABEL[code]}
                    {isCurrent && (
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-brand-blue stroke-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 5 5 9-10" />
                      </svg>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}
