import Image from "next/image";
import Link from "next/link";
import { cx } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
  iconOnly = false,
}: {
  className?: string;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cx(
        "flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue",
        className
      )}
      aria-label="חדד יובל אלקטריק בע״מ — לדף הבית"
    >
      <span
        className={cx(
          "relative block shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-brand-gold/35 transition-[width,height] duration-300",
          compact ? "h-9 w-9" : "h-10 w-10 md:h-12 md:w-12"
        )}
      >
        <Image
          src="/brand/logo.png"
          alt="חדד יובל אלקטריק בע״מ"
          fill
          sizes="48px"
          className="object-contain p-1"
          priority
        />
      </span>
      <span className={cx("hidden flex-col leading-tight", !iconOnly && "sm:flex", compact && !iconOnly && "sm:hidden")}>
        <span className="text-sm font-extrabold tracking-[-0.02em] text-graphite md:text-base">חדד יובל אלקטריק</span>
        <span className="mt-0.5 text-[10px] font-medium text-graphite-soft/60">מוצרי חשמל לבית · נהריה והצפון</span>
      </span>
    </Link>
  );
}
