import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getProductBySlug,
  getProducts,
  getProductsBySameBrand,
  getRelatedProducts,
} from "@/lib/base44/catalog";
import { generateProductMetadata, buildMetadata, SITE_NAME } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { ProductGrid } from "@/components/ProductGrid";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { AddToRequestButton } from "@/components/AddToRequestButton";
import { ProductStickyCta } from "@/components/ProductStickyCta";
import { ViewTracker } from "@/components/ViewTracker";
import { buildWhatsAppProductMessage } from "@/lib/whatsapp/messages";
import { JsonLd } from "@/components/JsonLd";
import { productJsonLd } from "@/lib/schema/jsonld";
import { BUSINESS, cx } from "@/lib/utils";
import { ProductImage } from "@/components/ProductImage";
import { productHeading, localizedBrandLabel } from "@/lib/seo/productNaming";
import { allBrandAliases } from "@/lib/seo/brandNames";
import { measure } from "@/lib/seo/catalogDimensions";
import { getDiscontinued } from "@/lib/seo/discontinued";
import { DiscontinuedProductPage } from "@/components/DiscontinuedProductPage";

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
  const decoded = decodeURIComponent(slug);
  const product = await getProductBySlug(decoded);
  if (!product) {
    // Discontinued models keep a real title so the result that already ranks on
    // the model number stays useful, and stay indexable: the page still answers
    // the query, it just answers it with "not any more, here is what we have".
    const discontinued = await getDiscontinued(decoded, 0);
    if (!discontinued) return {};
    return buildMetadata({
      title: `${discontinued.name} — הדגם אינו בקטלוג | ${SITE_NAME}`,
      absoluteTitle: true,
      description: `הדגם ${discontinued.name} (מק״ט ${discontinued.modelNumber}) כבר לא בקטלוג של חדד יובל אלקטריק. כאן תמצאו את הדגמים מאותה קטגוריה שזמינים כרגע, ואפשר לשאול אותנו מה המקביל המדויק.`,
      path: `/products/${decoded}`,
    });
  }
  return generateProductMetadata(product);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const product = await getProductBySlug(decodedSlug);

  if (!product) {
    // A slug the feed no longer serves is not automatically a bad URL. If this
    // page has existed before, it may hold rankings on its model number, so it
    // says the model is gone and offers what is in stock instead of 404ing.
    const discontinued = await getDiscontinued(decodedSlug);
    if (discontinued) return <DiscontinuedProductPage slug={decodedSlug} data={discontinued} />;
    notFound();
  }
  if (product.slug !== decodedSlug) {
    permanentRedirect(`/products/${product.slug}`);
  }

  const [related, sameBrand] = await Promise.all([
    getRelatedProducts(product, 4),
    getProductsBySameBrand(product, 4),
  ]);

  // A visitor landing on a discontinued model came for the category, not the
  // model number. The related rail lower down already carries stock-first
  // suggestions, but it sits below the spec table — too far to rescue the
  // visit. When this product is gone, lift the available models into the buy
  // column itself. Nothing is asserted about stock that the feed does not say:
  // these are the records marked in_stock, and the badge on this page still
  // reports this product honestly as unavailable.
  const inStockAlternatives =
    product.availability === "out_of_stock"
      ? related.filter((p) => p.availability === "in_stock").slice(0, 3)
      : [];

  const whatsappMessage = buildWhatsAppProductMessage(product);
  // Parsed from the spec sheet; null whenever the feed is ambiguous, so the
  // markup never claims a measurement the record does not support.
  const measured = measure(product);

  return (
    <>
      <ViewTracker event="product_view" slug={product.slug} category={product.categorySlug ?? undefined} />
      <JsonLd
        data={productJsonLd({
          name: productHeading(product),
          description: product.description,
          path: `/products/${product.slug}`,
          modelNumber: product.modelNumber,
          brand: product.brand,
          brandAlternateNames: allBrandAliases(product.brand),
          category: product.category,
          imageUrl: product.imageUrl,
          originCountry: product.originCountry,
          availability: product.availability,
          specs: product.specs,
          dimensionsCm: measured?.body ?? null,
        })}
      />
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
        <div className="surface-card grid overflow-hidden rounded-[2rem] md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden bg-[linear-gradient(145deg,#f6f4ef,#ebe8e1)]">
            <ProductImage
              src={product.imageUrl || "/images/product-placeholder-v2.webp"}
              alt={`${product.name} - חדד יובל אלקטריק בע״מ`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cx("object-contain", product.imageUrl ? "p-8 md:p-12" : "p-0 opacity-95")}
              priority
            />
          </div>

          <div className="flex flex-col justify-center p-6 md:p-10 lg:p-14">
            <p className="section-kicker">בחירה איכותית לבית</p>
            {product.brand && (
              <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-brand-blue">
                {localizedBrandLabel(product, "he")}
              </p>
            )}
            <h1 className="heading-balance mt-2 text-2xl font-black leading-[1.12] tracking-[-0.035em] text-graphite md:text-4xl">
              {productHeading(product)}
            </h1>

            <div className="mt-2.5 flex flex-wrap items-center gap-2.5 md:mt-3 md:gap-3">
              <AvailabilityBadge availability={product.availability} />
              {product.category && <span className="text-sm text-graphite-soft/70">{product.category}</span>}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-surface/80 px-3.5 py-3">
                <dt className="text-graphite-soft/60">מק״ט / דגם</dt>
                <dd className="font-medium text-graphite">{product.modelNumber}</dd>
              </div>
              {product.originCountry && (
                <div className="rounded-xl bg-surface/80 px-3.5 py-3">
                  <dt className="text-graphite-soft/60">ארץ ייצור</dt>
                  <dd className="font-medium text-graphite">{product.originCountry}</dd>
                </div>
              )}
            </dl>

            <p className="mt-5 text-[15px] leading-relaxed text-graphite-soft/85 md:text-base">
              {product.description}
            </p>

            <div className="mt-6 hidden flex-col gap-3 sm:flex-row md:mt-7 md:flex">
              <AddToRequestButton product={product} className="flex-1" />
              <WhatsAppButton
                message={whatsappMessage}
                label={product.availability === "out_of_stock" ? "בדקו אפשרות הזמנה בוואטסאפ" : "הזמן בוואטסאפ"}
                className="flex-1"
                trackAs="whatsapp_click_product"
                trackSlug={product.slug}
              />
            </div>
            <PhoneButton
              phone={BUSINESS.phoneDisplay}
              label="התקשר להזמנה"
              className="mt-3 hidden w-full sm:w-auto md:flex"
            />

            {inStockAlternatives.length > 0 && (
              <section
                className="mt-6 rounded-2xl border border-line bg-surface/70 p-4"
                aria-labelledby="alternatives-heading"
              >
                <h2 id="alternatives-heading" className="text-sm font-bold text-graphite">
                  דגמים דומים שזמינים עכשיו
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-graphite-soft/70">
                  הדגם הזה לא במלאי כרגע. אלה הדגמים מאותה קטגוריה שכן זמינים — אפשר להשוות מפרט
                  ומידות, או לשלוח לנו הודעה ונעזור להתאים.
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {inStockAlternatives.map((alt) => (
                    <li key={alt.slug}>
                      <a
                        href={`/products/${alt.slug}`}
                        className="block rounded-xl px-3 py-2 text-[13px] font-medium text-graphite transition hover:bg-surface"
                      >
                        {productHeading(alt)}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-5 text-center text-[10px] font-semibold text-graphite-soft/70 sm:text-xs">
              <span>משלוח בצפון</span>
              <span className="border-x border-line">שירות מחנות פיזית</span>
              <span>יבואנים רשמיים</span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-graphite-soft/55">
              האתר מציג מידע כללי בלבד, ללא מחיר. זמינות המלאי כפופה לאישור החנות.
            </p>
          </div>
        </div>

        {product.specs.length > 0 && (
          <section className="mt-12 md:mt-16" aria-labelledby="specs-heading">
            <p className="section-kicker">כל הפרטים</p>
            <h2 id="specs-heading" className="mt-2 text-2xl font-black text-graphite md:text-3xl">
              מפרט טכני
            </h2>
            <div className="surface-card mt-5 overflow-hidden rounded-[1.5rem]">
              <table className="w-full text-[13px] md:text-sm">
                <tbody>
                  {product.specs.map((spec, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-surface/65"}>
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
          <section className="mt-10 rounded-[1.75rem] bg-[#071a2c] p-6 text-white md:mt-12 md:p-9" aria-labelledby="capabilities-heading">
            <h2 id="capabilities-heading" className="text-xl font-black md:text-2xl">
              יכולות ומאפיינים
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {product.capabilities.map((capability, index) => (
                <li key={index} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/75">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
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
    </>
  );
}
