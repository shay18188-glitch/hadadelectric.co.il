import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/schema/jsonld";

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const allItems: BreadcrumbItem[] = [{ name: "בית", path: "/" }, ...items];

  return (
    <nav aria-label="פירורי לחם" className="container-page py-3 text-sm text-graphite-soft/80">
      <ol className="flex flex-wrap items-center gap-1.5">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="text-line">
                  /
                </span>
              )}
              {isLast ? (
                <span aria-current="page" className="font-medium text-graphite">
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
