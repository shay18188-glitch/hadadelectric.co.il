import Link from "next/link";
import type { Brand } from "@/types/brand";

export function BrandStrip({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {brands.map((brand) => (
        <Link
          key={brand.slug}
          href={`/brands/${brand.slug}`}
          className="group grid min-h-20 place-items-center rounded-2xl border border-line/80 bg-white px-4 py-4 text-center text-sm font-black tracking-wide text-graphite-soft/80 shadow-[0_12px_35px_-30px_rgba(11,23,36,0.5)] transition duration-300 hover:-translate-y-0.5 hover:border-brand-gold/50 hover:text-brand-blue sm:min-h-24 sm:text-base"
        >
          <span className="transition-transform group-hover:scale-105">{brand.name}</span>
        </Link>
      ))}
    </div>
  );
}
