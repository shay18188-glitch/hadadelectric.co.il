import Link from "next/link";
import type { Brand } from "@/types/brand";

export function BrandStrip({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {brands.map((brand) => (
        <Link
          key={brand.slug}
          href={`/brands/${brand.slug}`}
          className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-graphite transition-colors hover:border-brand-blue/40 hover:bg-brand-blue-light hover:text-brand-blue"
        >
          {brand.name}
        </Link>
      ))}
    </div>
  );
}
