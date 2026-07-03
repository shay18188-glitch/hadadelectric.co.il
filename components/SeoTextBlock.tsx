import type { ReactNode } from "react";

export function SeoTextBlock({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="max-w-none space-y-4 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-graphite [&_li]:text-graphite-soft/90 [&_p]:leading-relaxed [&_p]:text-graphite-soft/90 [&_ul]:list-disc [&_ul]:ps-5">
      {title && <h2 className="mb-3 text-xl font-bold text-graphite md:text-2xl">{title}</h2>}
      {children}
    </section>
  );
}
