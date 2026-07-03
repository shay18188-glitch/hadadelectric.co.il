import Image from "next/image";
import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue ${className ?? ""}`}
      aria-label="חדד יובל אלקטריק בע״מ — לדף הבית"
    >
      <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-line md:h-12 md:w-12">
        <Image
          src="/brand/logo.png"
          alt="חדד יובל אלקטריק בע״מ"
          fill
          sizes="48px"
          className="object-contain p-1"
          priority
        />
      </span>
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="text-sm font-bold text-graphite md:text-base">חדד יובל אלקטריק</span>
        <span className="text-[11px] text-graphite-soft/70">מוצרי חשמל בנהריה והצפון</span>
      </span>
    </Link>
  );
}
