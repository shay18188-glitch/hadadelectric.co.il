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
  /** "bottom" = mobile bottom sheet (filters), "end" = side drawer (main menu). */
  placement?: "bottom" | "end";
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
      : "sheet-panel-end fixed inset-y-0 right-0 z-[70] flex w-[86%] max-w-sm flex-col overflow-hidden border-s border-line bg-white shadow-2xl";

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
          <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
            <h2 id={titleId} className="text-base font-bold text-graphite">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="סגירה"
              className="tap-target -m-2 inline-flex items-center justify-center rounded-full p-2 text-graphite-soft/70 transition-colors hover:bg-surface"
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
