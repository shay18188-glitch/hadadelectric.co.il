import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/schema/jsonld";

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const allItems: BreadcrumbItem[] = [{ name: "בית", path: "/" }, ...items];

  return (
    <nav aria-label="פירורי לחם" className="container-page py-2 text-xs text-graphite-soft/80 md:py-3 md:text-sm">
      <ol className="flex flex-wrap items-center gap-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1">
              {index > 0 && (
                <span aria-hidden="true" className="text-line">
                  /
                </span>
              )}
              {isLast ? (
                <span aria-current="page" className="line-clamp-1 max-w-[12rem] font-medium text-graphite sm:max-w-none">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="hover:text-brand-blue hover:underline">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <JsonLd data={breadcrumbJsonLd(allItems)} />
    </nav>
  );
}
