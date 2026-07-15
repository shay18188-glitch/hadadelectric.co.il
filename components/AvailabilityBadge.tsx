import type { AvailabilityState } from "@/types/product";
import type { Locale } from "@/lib/i18n/locales";
import { cx } from "@/lib/utils";

const CLASSES: Record<AvailabilityState, string> = {
  in_stock: "bg-success-bg text-success",
  out_of_stock: "bg-neutral-bg text-graphite-soft",
  unknown: "bg-warning-bg text-warning-text",
};

const LABELS: Record<Locale, Record<AvailabilityState, string>> = {
  he: {
    in_stock: "במלאי",
    out_of_stock: "לא במלאי כרגע",
    unknown: "צור קשר לבדיקת זמינות",
  },
  en: {
    in_stock: "In stock",
    out_of_stock: "Out of stock",
    unknown: "Contact us for availability",
  },
  ru: {
    in_stock: "В наличии",
    out_of_stock: "Нет в наличии",
    unknown: "Уточните наличие",
  },
};

export function AvailabilityBadge({
  availability,
  className,
  locale = "he",
}: {
  availability: AvailabilityState;
  className?: string;
  locale?: Locale;
}) {
  return (
    <span
      role="status"
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        CLASSES[availability],
        className
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[locale][availability]}
    </span>
  );
}
