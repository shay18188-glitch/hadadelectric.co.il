import type { AvailabilityState } from "@/types/product";
import { cx } from "@/lib/utils";

const CONFIG: Record<AvailabilityState, { label: string; classes: string }> = {
  in_stock: {
    label: "במלאי",
    classes: "bg-success-bg text-success",
  },
  out_of_stock: {
    label: "לא במלאי כרגע",
    classes: "bg-neutral-bg text-graphite-soft",
  },
  unknown: {
    label: "צור קשר לבדיקת זמינות",
    classes: "bg-warning-bg text-warning-text",
  },
};

export function AvailabilityBadge({
  availability,
  className,
}: {
  availability: AvailabilityState;
  className?: string;
}) {
  const config = CONFIG[availability];
  return (
    <span
      role="status"
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.classes,
        className
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
