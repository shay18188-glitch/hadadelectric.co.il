"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useHasMounted } from "@/lib/useHasMounted";
import { cx } from "@/lib/utils";

const ANIMATION_MS = 220;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** "search" is a top-anchored full-height dialog that stays usable above the mobile keyboard. */
  placement?: "bottom" | "end" | "search";
  className?: string;
}

/**
 * Premium, dependency-free mobile sheet/drawer primitive. Portals to
 * `document.body` so it is never affected by an ancestor's CSS transform
 * (e.g. the floating header's hide/show transform), locks body scroll while
 * open, closes on Escape/backdrop click, and plays a smooth exit animation
 * before unmounting. Respects `prefers-reduced-motion` via globals.css.
 */
export function BottomSheet({ open, onClose, children, title, placement = "bottom", className }: BottomSheetProps) {
  const mounted = useHasMounted();
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(open);
  const titleId = useId();

  if (open && !rendered) {
    setRendered(true);
  }
  if (open && closing) {
    setClosing(false);
  }

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;

    if (wasOpen && !open && rendered) {
      setClosing(true);
      const timeout = window.setTimeout(() => {
        setRendered(false);
        setClosing(false);
      }, ANIMATION_MS);
      return () => window.clearTimeout(timeout);
    }
  }, [open, rendered]);

  useEffect(() => {
    if (!rendered) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [rendered]);

  useEffect(() => {
    if (!rendered) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [rendered, onClose]);

  useEffect(() => {
    if (rendered && !closing) {
      panelRef.current?.focus();
    }
  }, [rendered, closing]);

  if (!mounted || !rendered) return null;

  const panelClasses =
    placement === "bottom"
      ? "sheet-panel-bottom fixed inset-x-0 bottom-0 z-[70] flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl border-t border-line bg-white shadow-2xl"
      : placement === "end"
        ? "sheet-panel-end fixed inset-y-0 right-0 z-[70] flex w-[92%] max-w-[25rem] flex-col overflow-hidden rounded-s-[2rem] border-s border-line/80 bg-[#f7f9fb] shadow-[0_0_80px_-24px_rgba(7,26,44,0.55)]"
        : "sheet-panel-search fixed inset-0 z-[70] flex h-[100dvh] flex-col overflow-hidden bg-[#f7f9fb]";

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div
        aria-hidden="true"
        data-closing={closing ? "true" : "false"}
        onClick={onClose}
        className="sheet-backdrop fixed inset-0 bg-graphite/40 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        data-closing={closing ? "true" : "false"}
        className={cx(panelClasses, className)}
      >
        {placement === "bottom" && (
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line" aria-hidden="true" />
        )}
        {title && (
          <div
            className={cx(
              "flex shrink-0 items-center justify-between border-b border-line px-5 py-4",
              placement === "end" && "border-brand-gold/20 bg-white/92 py-4.5 backdrop-blur-xl",
              placement === "search" && "safe-top bg-white/94 pb-3 pt-3 shadow-sm backdrop-blur-xl"
            )}
          >
            <h2 id={titleId} className={cx("text-base font-bold text-graphite", placement === "end" && "text-lg font-extrabold tracking-[-0.02em]", placement === "search" && "text-lg font-extrabold") }>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="סגירה"
              className={cx(
                "tap-target -m-2 inline-flex items-center justify-center rounded-full p-2 text-graphite-soft/70 transition-colors hover:bg-surface",
                placement === "end" && "m-0 h-10 w-10 bg-surface p-0 text-graphite hover:bg-brand-blue-light hover:text-brand-blue"
              )}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        )}
        <div className="safe-bottom flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
