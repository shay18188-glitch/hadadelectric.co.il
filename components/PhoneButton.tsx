"use client";

import { trackEvent } from "@/lib/analytics";
import { cx } from "@/lib/utils";
import { telHref } from "@/lib/whatsapp/messages";

interface PhoneButtonProps {
  phone: string;
  label?: string;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "md" | "lg" | "sm";
  /** Renders as a square icon-only button, keeping the label for screen readers. */
  iconOnly?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<PhoneButtonProps["variant"]>, string> = {
  primary: "bg-brand-blue text-white hover:bg-brand-blue-dark",
  outline: "border border-line bg-white text-graphite hover:bg-surface",
  ghost: "text-graphite hover:bg-surface",
};

const SIZE_CLASSES: Record<NonNullable<PhoneButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function PhoneButton({
  phone,
  label = "התקשרו עכשיו",
  className,
  variant = "outline",
  size = "md",
  iconOnly = false,
}: PhoneButtonProps) {
  return (
    <a
      href={telHref(phone)}
      aria-label={iconOnly ? label : undefined}
      onClick={() => trackEvent("phone_click", { phone })}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
        VARIANT_CLASSES[variant],
        iconOnly ? "h-10 w-10 p-0" : SIZE_CLASSES[size],
        className
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className={cx("shrink-0 fill-current", iconOnly ? "h-5 w-5 sm:h-6 sm:w-6" : "h-4 w-4")}>
        <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
      </svg>
      {iconOnly ? <span className="sr-only">{label}</span> : label}
    </a>
  );
}
