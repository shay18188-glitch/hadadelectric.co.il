"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { cx } from "@/lib/utils";
import {
  A11Y_STORAGE_KEY,
  DEFAULT_A11Y_SETTINGS,
  FONT_SCALE_STEPS,
  isDefaultSettings,
  type A11ySettings,
} from "@/lib/a11y/settings";
import { applyA11ySettings } from "@/lib/a11y/apply";

function readStored(): A11ySettings {
  if (typeof window === "undefined") return DEFAULT_A11Y_SETTINGS;
  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return DEFAULT_A11Y_SETTINGS;
    return { ...DEFAULT_A11Y_SETTINGS, ...(JSON.parse(raw) as Partial<A11ySettings>) };
  } catch {
    return DEFAULT_A11Y_SETTINGS;
  }
}

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  // Lazy init from storage. Safe against hydration mismatch: nothing in the
  // initial render (panel closed) is derived from `settings`. The inline
  // bootstrap script has already applied these settings to the DOM.
  const [settings, setSettings] = useState<A11ySettings>(readStored);
  const fabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const commit = useCallback((next: A11ySettings) => {
    setSettings(next);
    applyA11ySettings(next);
    try {
      if (isDefaultSettings(next)) {
        window.localStorage.removeItem(A11Y_STORAGE_KEY);
      } else {
        window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(next));
      }
    } catch {
      /* storage may be unavailable (private mode) — settings still apply for the session */
    }
  }, []);

  const patch = useCallback(
    (p: Partial<A11ySettings>) => commit({ ...settings, ...p }),
    [commit, settings]
  );

  const changeFont = (dir: 1 | -1) => {
    const next = Math.max(0, Math.min(FONT_SCALE_STEPS.length - 1, settings.fontStep + dir));
    patch({ fontStep: next });
  };

  const reset = () => commit(DEFAULT_A11Y_SETTINGS);

  // Close on Escape and return focus to the trigger.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Move focus into the panel when it opens.
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>("button, a, [tabindex]")?.focus();
  }, [open]);

  const fontPct = Math.round(FONT_SCALE_STEPS[settings.fontStep] * 100);

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="פתיחת תפריט נגישות"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="a11y-fab safe-bottom fixed bottom-24 left-3 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue text-white shadow-lg ring-1 ring-black/10 transition hover:bg-brand-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue md:bottom-6 md:left-6 md:h-14 md:w-14"
      >
        <AccessibilityIcon className="h-7 w-7 md:h-8 md:w-8" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="a11y-panel safe-bottom fixed bottom-3 left-3 z-[65] flex max-h-[85vh] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white text-graphite shadow-2xl md:bottom-6 md:left-6"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
              <h2 id={titleId} className="flex items-center gap-2 text-base font-bold">
                <AccessibilityIcon className="h-5 w-5 text-brand-blue" />
                תפריט נגישות
              </h2>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  fabRef.current?.focus();
                }}
                aria-label="סגירת תפריט נגישות"
                className="flex h-8 w-8 items-center justify-center rounded-full text-graphite-soft/70 transition hover:bg-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Font size */}
              <div className="rounded-xl border border-line p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">גודל טקסט</span>
                  <span className="text-xs tabular-nums text-graphite-soft/70" aria-live="polite">
                    {fontPct}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeFont(-1)}
                    disabled={settings.fontStep === 0}
                    aria-label="הקטנת גודל הטקסט"
                    className="flex h-10 flex-1 items-center justify-center rounded-lg border border-line text-lg font-bold transition hover:bg-surface disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                  >
                    A−
                  </button>
                  <button
                    type="button"
                    onClick={() => changeFont(1)}
                    disabled={settings.fontStep === FONT_SCALE_STEPS.length - 1}
                    aria-label="הגדלת גודל הטקסט"
                    className="flex h-10 flex-1 items-center justify-center rounded-lg border border-line text-xl font-bold transition hover:bg-surface disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ToggleButton
                  label="ניגודיות כהה"
                  pressed={settings.contrast === "dark"}
                  onClick={() => patch({ contrast: settings.contrast === "dark" ? "none" : "dark" })}
                />
                <ToggleButton
                  label="ניגודיות בהירה"
                  pressed={settings.contrast === "light"}
                  onClick={() => patch({ contrast: settings.contrast === "light" ? "none" : "light" })}
                />
                <ToggleButton
                  label="פונט קריא"
                  pressed={settings.readableFont}
                  onClick={() => patch({ readableFont: !settings.readableFont })}
                />
                <ToggleButton
                  label="הדגשת קישורים"
                  pressed={settings.highlightLinks}
                  onClick={() => patch({ highlightLinks: !settings.highlightLinks })}
                />
                <ToggleButton
                  label="סמן גדול"
                  pressed={settings.bigCursor}
                  onClick={() => patch({ bigCursor: !settings.bigCursor })}
                />
                <ToggleButton
                  label="עצירת אנימציות"
                  pressed={settings.stopAnimations}
                  onClick={() => patch({ stopAnimations: !settings.stopAnimations })}
                />
              </div>

              <button
                type="button"
                onClick={reset}
                className="mt-3 w-full rounded-lg border border-line py-2.5 text-sm font-semibold text-graphite-soft transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                איפוס הגדרות נגישות
              </button>

              <Link
                href="/accessibility"
                onClick={() => setOpen(false)}
                className="mt-3 block rounded-lg bg-brand-blue-light py-2.5 text-center text-sm font-semibold text-brand-blue-dark transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                להצהרת הנגישות המלאה
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function ToggleButton({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cx(
        "flex min-h-[3rem] items-center justify-center rounded-xl border px-2 py-2 text-center text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
        pressed
          ? "border-brand-blue bg-brand-blue text-white"
          : "border-line bg-white text-graphite hover:bg-surface"
      )}
    >
      {label}
    </button>
  );
}

function AccessibilityIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="4" r="2" />
      <path d="M12 8c-2.3 0-4.2-.5-5.7-1.1a1 1 0 1 0-.7 1.9c1.1.4 2.4.8 3.9 1v2.5l-1.6 5.3a1 1 0 0 0 1.9.6L11 14h2l1.2 4.2a1 1 0 0 0 1.9-.6L14.5 12.3V9.8c1.5-.2 2.8-.6 3.9-1a1 1 0 1 0-.7-1.9C16.2 7.5 14.3 8 12 8Z" />
    </svg>
  );
}
