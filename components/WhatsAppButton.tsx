"use client";

import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";
import { cx } from "@/lib/utils";

interface WhatsAppButtonProps {
  message: string;
  label?: string;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  trackAs?: AnalyticsEvent;
  size?: "md" | "lg" | "sm";
  /** Renders as a square icon-only button, keeping the label for screen readers. */
  iconOnly?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<WhatsAppButtonProps["variant"]>, string> = {
  primary: "bg-[#25D366] text-white hover:bg-[#1fbd5a]",
  outline: "border border-line bg-white text-graphite hover:bg-surface",
  ghost: "text-graphite hover:bg-surface",
};

const SIZE_CLASSES: Record<NonNullable<WhatsAppButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function WhatsAppButton({
  message,
  label = "הזמנה בוואטסאפ",
  className,
  variant = "primary",
  trackAs = "whatsapp_click_product",
  size = "md",
  iconOnly = false,
}: WhatsAppButtonProps) {
  const href = `https://wa.me/972522692235?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={iconOnly ? label : undefined}
      onClick={() => trackEvent(trackAs)}
      className={cx(
        "tap-target inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
        VARIANT_CLASSES[variant],
        iconOnly ? "h-10 w-10 p-0" : SIZE_CLASSES[size],
        className
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current">
        <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38A9.94 9.94 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.2c-1.6 0-3.15-.43-4.5-1.24l-.32-.19-3.12.82.83-3.04-.21-.32A8.18 8.18 0 0 1 3.8 12c0-4.55 3.7-8.24 8.24-8.24 4.55 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.2-8.24 8.2Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.12-.56.12-.17.25-.64.8-.79.96-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.15-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.41 1.02 2.58.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
      </svg>
      {iconOnly ? <span className="sr-only">{label}</span> : label}
    </a>
  );
}
