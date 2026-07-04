import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getProducts,
  getProductsBySameBrand,
  getRelatedProducts,
} from "@/lib/base44/catalog";
import { generateProductMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { ProductGrid } from "@/components/ProductGrid";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { AddToRequestButton } from "@/components/AddToRequestButton";
import { ProductStickyCta } from "@/components/ProductStickyCta";
import { JsonLd } from "@/components/JsonLd";
import { productJsonLd } from "@/lib/schema/jsonld";
import { buildWhatsAppProductMessage } from "@/lib/whatsapp/messages";
import { BUSINESS, cx } from "@/lib/utils";

export const revalidate = 10800; // 3 hours

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));
  if (!product) return {};
  return generateProductMetadata(product);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));

  if (!product) notFound();

  const [related, sameBrand] = await Promise.all([
    getRelatedProducts(product, 4),
    getProductsBySameBrand(product, 4),
  ]);

  const whatsappMessage = buildWhatsAppProductMessage(product);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "קטלוג", path: "/products" },
          ...(product.category && product.categorySlug
            ? [{ name: product.category, path: `/categories/${product.categorySlug}` }]
            : []),
          { name: product.name, path: `/products/${product.slug}` },
        ]}
      />

      <div className="container-page pb-20 md:pb-16">
        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface md:rounded-3xl">
            <Image
              src={product.imageUrl || "/images/product-placeholder.svg"}
              alt={`${product.name} - חדד יובל אלקטריק בע״מ`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cx("object-contain p-6 md:p-8", !product.imageUrl && "opacity-40")}
              priority
            />
          </div>

          <div>
            {product.brand && <p className="text-sm font-semibold text-brand-blue">{product.brand}</p>}
            <h1 className="mt-1 text-xl font-bold text-graphite md:text-3xl">{product.name}</h1>

            <div className="mt-2.5 flex flex-wrap items-center gap-2.5 md:mt-3 md:gap-3">
              <AvailabilityBadge availability={product.availability} />
              {product.category && <span className="text-sm text-graphite-soft/70">{product.category}</span>}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-graphite-soft/60">מק״ט / דגם</dt>
                <dd className="font-medium text-graphite">{product.modelNumber}</dd>
              </div>
              {product.originCountry && (
                <div>
                  <dt className="text-graphite-soft/60">ארץ ייצור</dt>
                  <dd className="font-medium text-graphite">{product.originCountry}</dd>
                </div>
              )}
            </dl>

            <p className="mt-4 text-[15px] leading-relaxed text-graphite-soft/90 md:mt-5 md:text-base">
              {product.description}
            </p>

            <div className="mt-6 hidden flex-col gap-3 sm:flex-row md:mt-7 md:flex">
              <AddToRequestButton product={product} className="flex-1" />
              <WhatsAppButton
                message={whatsappMessage}
                label={product.availability === "out_of_stock" ? "בדקו אפשרות הזמנה בוואטסאפ" : "הזמן בוואטסאפ"}
                className="flex-1"
                trackAs="whatsapp_click_product"
              />
            </div>
            <PhoneButton
              phone={BUSINESS.phoneDisplay}
              label="התקשר להזמנה"
              className="mt-3 hidden w-full sm:w-auto md:flex"
            />

            <p className="mt-4 text-xs text-graphite-soft/60">
              האתר מציג מידע כללי בלבד, ללא מחיר. זמינות המלאי כפופה לאישור החנות.
            </p>
          </div>
        </div>

        {product.specs.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="text-lg font-bold text-graphite md:text-2xl">
              מפרט טכני
            </h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-line md:mt-4">
              <table className="w-full text-[13px] md:text-sm">
                <tbody>
                  {product.specs.map((spec, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-surface"}>
                      {spec.label ? (
                        <>
                          <th scope="row" className="w-2/5 px-3 py-2.5 text-start font-medium text-graphite-soft/70 md:w-1/3 md:px-4 md:py-3">
                            {spec.label}
                          </th>
                          <td className="px-3 py-2.5 text-graphite md:px-4 md:py-3">{spec.value}</td>
                        </>
                      ) : (
                        <td colSpan={2} className="px-3 py-2.5 text-graphite md:px-4 md:py-3">
                          {spec.value}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {product.capabilities.length > 0 && (
          <section className="mt-8 md:mt-10" aria-labelledby="capabilities-heading">
            <h2 id="capabilities-heading" className="text-lg font-bold text-graphite md:text-2xl">
              יכולות ומאפיינים
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:mt-4">
              {product.capabilities.map((capability, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-graphite-soft/90">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                  {capability}
                </li>
              ))}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-lg font-bold text-graphite md:text-2xl">
              מוצרים נוספים מאותה קטגוריה
            </h2>
            <div className="mt-3 md:mt-4">
              <ProductGrid products={related} />
            </div>
          </section>
        )}

        {sameBrand.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="brand-heading">
            <h2 id="brand-heading" className="text-lg font-bold text-graphite md:text-2xl">
              מוצרים נוספים של {product.brand}
            </h2>
            <div className="mt-3 md:mt-4">
              <ProductGrid products={sameBrand} />
            </div>
          </section>
        )}
      </div>

      <ProductStickyCta product={product} />
      <JsonLd data={productJsonLd(product)} />
    </>
  );
}
