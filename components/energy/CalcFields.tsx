"use client";

import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

/**
 * The input and result primitives the electricity calculators share, styled
 * after the niche-fit tool so the tools read as one set.
 *
 * Inputs hold strings, not numbers: a person clearing a field to retype it
 * should see an empty box, not a 0 the calculator has decided on for them.
 */

export function parseNum(value: string): number | null {
  const n = Number(value.replace(",", "."));
  return value.trim() !== "" && Number.isFinite(n) ? n : null;
}

export function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
  min = 0,
  step = "any",
  help,
}: {
  id: string;
  label: string;
  unit?: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  step?: number | "any";
  help?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-graphite">
        {label}
      </label>
      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-brand-blue">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={help ? `${id}-help` : undefined}
          className="w-full min-w-0 bg-transparent py-2.5 text-lg font-semibold tabular-nums text-graphite outline-none"
        />
        {unit && <span className="shrink-0 text-sm text-graphite-soft/60">{unit}</span>}
      </div>
      {help && (
        <p id={`${id}-help`} className="mt-1 text-xs leading-relaxed text-graphite-soft/60">
          {help}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-graphite">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-3 text-base font-medium text-graphite focus:border-brand-blue focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ToggleChips<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-graphite">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={cx(
              "tap-target rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              value === option.value
                ? "border-brand-blue bg-brand-blue-light text-brand-blue"
                : "border-line bg-white text-graphite hover:bg-surface"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** The headline answer plus the supporting rows, announced to screen readers as it changes. */
export function ResultPanel({
  primaryLabel,
  primaryValue,
  rows,
  notes,
  empty,
  children,
}: {
  primaryLabel: string;
  primaryValue: string | null;
  rows?: { label: string; value: string }[];
  notes?: string[];
  empty?: string;
  children?: ReactNode;
}) {
  return (
    <div className="surface-card rounded-[1.5rem] p-5 md:p-6" aria-live="polite">
      {primaryValue === null ? (
        <p className="text-sm text-graphite-soft/75">{empty ?? "מלאו את השדות כדי לראות את התוצאה."}</p>
      ) : (
        <>
          <p className="text-sm font-semibold text-graphite-soft/75">{primaryLabel}</p>
          <p className="mt-1 text-3xl font-black tabular-nums tracking-[-0.03em] text-brand-blue md:text-4xl">
            {primaryValue}
          </p>
          {rows && rows.length > 0 && (
            <dl className="mt-4 divide-y divide-line/70 border-t border-line/70">
              {rows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-graphite-soft/80">{row.label}</dt>
                  <dd className="shrink-0 font-semibold tabular-nums text-graphite">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {notes && notes.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {notes.map((note) => (
                <li key={note} className="text-xs leading-relaxed text-graphite-soft/70">
                  {note}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {children}
    </div>
  );
}
