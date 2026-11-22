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
import { BUSINESS } from "@/lib/utils";
import { ProductGallery } from "@/components/ProductGallery";
import { ExpertNote } from "@/components/ExpertNote";
import { ProductRunningCost } from "@/components/energy/ProductRunningCost";
import { productHeading, localizedBrandLabel } from "@/lib/seo/productNaming";
import { allBrandAliases } from "@/lib/seo/brandNames";
import { measure } from "@/lib/seo/catalogDimensions";
import { getDiscontinued } from "@/lib/seo/discontinued";
import { DiscontinuedProductPage } from "@/components/DiscontinuedProductPage";
import { getPublishedResearch } from "@/lib/research/published";
import { shownModel } from "@/types/product";
import { FitAndConsiderations, ProductFaq, ProductHighlights } from "@/components/ProductResearch";
import { KeyFacts } from "@/components/ProductDetails";
import { ProductMoreDetails } from "@/components/ProductMoreDetails";
import { keyFacts } from "@/lib/productLayout";
import { faqJsonLd } from "@/lib/schema/jsonld";
import { researchWeightKg } from "@/lib/research/facts";

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
  // Present only for models whose record passed research and QA; every
  // section that reads it renders nothing without it.
  const research = getPublishedResearch(product.modelNumber);
  // The numbers a buyer of this kind of product compares on, in the order
  // that matters for it (see lib/productLayout.ts). The model code leads so
  // a reader can check it against the box or a quote.
  const facts = keyFacts(product, 5);
  const tiles = [
    { label: "מק״ט / דגם", value: shownModel(product) },
    ...facts,
    ...(product.originCountry && facts.length < 5 ? [{ label: "ארץ ייצור", value: product.originCountry }] : []),
  ];

  return (
    <>
      <ViewTracker event="product_view" slug={product.slug} category={product.categorySlug ?? undefined} />
      <JsonLd
        data={productJsonLd({
          name: productHeading(product),
          description: product.description,
          path: `/products/${product.slug}`,
          modelNumber: shownModel(product),
          brand: product.brand,
          brandAlternateNames: allBrandAliases(product.brand),
          category: product.category,
          imageUrl: product.imageUrl,
          images: product.images,
          originCountry: product.originCountry,
          specs: product.specs,
          dimensionsCm: measured?.body ?? null,
          weightKg: research ? researchWeightKg(research) : null,
          expertNote: product.expertNote,
        })}
      />
      {research && research.faq.length > 0 && (
        <JsonLd data={faqJsonLd(research.faq.map((f) => ({ question: f.q, answer: f.a })))} />
      )}
      <Breadcrumbs
        items={[
          { name: "קטלוג", path: "/products" },
          ...(product.category && product.categorySlug
            ? [{ name: product.category, path: `/categories/${product.categorySlug}` }]
            : []),
          { name: product.name, path: `/products/${product.slug}` },
        ]}
      />

      <div className="container-page pb-24 md:pb-16">
        <div className="surface-card grid overflow-hidden rounded-[2rem] md:grid-cols-2">
          <ProductGallery
            images={product.images}
            alt={`${product.name} - חדד יובל אלקטריק בע״מ`}
            locale="he"
            imageClassName="p-8 md:p-12"
            thumbsClassName="px-4 pb-4 md:px-6 md:pb-6"
          />

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

            <KeyFacts facts={tiles} ariaLabel="הנתונים החשובים" className="mt-5" />

            <p className="mt-5 text-[15px] leading-relaxed text-graphite-soft/85 md:text-base">
              {product.description}
            </p>
            {research && <ProductHighlights research={research} />}

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

        {/* Above the spec table on purpose. The specs are the same rows every
            competitor prints from the same importer feed; this is the part of
            the page only this shop can show, so it is read first. */}
        <ExpertNote note={product.expertNote} modelNumber={product.modelNumber} locale="he" />

        <ProductRunningCost product={product} />

        {research && <FitAndConsiderations research={research} />}

        <ProductMoreDetails
          product={product}
          research={research}
          locale="he"
          modelNumber={shownModel(product)}
          keyFactCount={facts.length}
        />

        {research && <ProductFaq research={research} modelNumber={shownModel(product)} />}

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
