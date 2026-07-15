import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductGrid";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { AddToRequestButton } from "@/components/AddToRequestButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { buildWhatsAppProductMessage } from "@/lib/whatsapp/messages";
import { localizeProduct, localizeProducts, localizeCategoryName } from "@/lib/i18n/translated";
import { JsonLd } from "@/components/JsonLd";
import { itemPageJsonLd } from "@/lib/schema/jsonld";
import { LOCALE_HTML_LANG, LOCALE_PREFIX, type Locale } from "@/lib/i18n/locales";
import { BUSINESS, cx } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";

type UiLocale = Exclude<Locale, "he">;

const CATALOG_TEXT: Record<UiLocale, {
  title: string;
  intro: string;
  allCategories: string;
  inStockOnly: string;
  productsCount: (n: number) => string;
  model: string;
  origin: string;
  specs: string;
  capabilities: string;
  related: string;
  sameBrand: (brand: string) => string;
  notice: string;
  whatsappOrder: string;
  whatsappCheck: string;
  call: string;
  mtNote: string;
}> = {
  en: {
    title: "Home appliance catalog",
    intro:
      "Our full catalog of home appliances. Filter by category and availability, then contact the store team for an exact availability check and a personal quote — we speak English.",
    allCategories: "All categories",
    inStockOnly: "In stock only",
    productsCount: (n) => `${n} products`,
    model: "Model",
    origin: "Country of origin",
    specs: "Technical specifications",
    capabilities: "Features",
    related: "More products in this category",
    sameBrand: (brand) => `More products by ${brand}`,
    notice: "The site shows general information only, without prices. Stock availability is subject to store confirmation.",
    whatsappOrder: "Order on WhatsApp",
    whatsappCheck: "Check availability on WhatsApp",
    call: "Call to order",
    mtNote: "Product details are translated automatically; specifications may appear in Hebrew.",
  },
  ru: {
    title: "Каталог бытовой техники",
    intro:
      "Полный каталог бытовой техники. Отфильтруйте по категории и наличию, а затем свяжитесь с командой магазина для точной проверки наличия и персонального предложения — мы говорим по-русски.",
    allCategories: "Все категории",
    inStockOnly: "Только в наличии",
    productsCount: (n) => `Товаров: ${n}`,
    model: "Модель",
    origin: "Страна производства",
    specs: "Технические характеристики",
    capabilities: "Возможности",
    related: "Ещё товары из этой категории",
    sameBrand: (brand) => `Ещё товары ${brand}`,
    notice: "Сайт содержит только общую информацию, без цен. Наличие товара подтверждается магазином.",
    whatsappOrder: "Заказать в WhatsApp",
    whatsappCheck: "Уточнить наличие в WhatsApp",
    call: "Позвонить для заказа",
    mtNote: "Описания товаров переведены автоматически; характеристики могут отображаться на иврите.",
  },
};

export function LocaleProductsPage({
  locale,
  products,
  categories,
  activeCategory,
  inStockOnly,
}: {
  locale: UiLocale;
  products: Product[];
  categories: Category[];
  activeCategory?: string;
  inStockOnly?: boolean;
}) {
  const t = CATALOG_TEXT[locale];
  const prefix = LOCALE_PREFIX[locale];

  let filtered = products;
  if (activeCategory) filtered = filtered.filter((p) => p.categorySlug === activeCategory);
  if (inStockOnly) filtered = filtered.filter((p) => p.availability === "in_stock");
  const localized = localizeProducts(filtered, locale);

  // Category chips ordered by catalog size, translated names with fallback.
  const chips = categories.map((c) => ({
    slug: c.slug,
    name: localizeCategoryName(c.slug, c.name, locale) ?? c.name,
  }));

  function listHref(category?: string, inStock?: boolean): string {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (inStock) params.set("inStock", "true");
    const qs = params.toString();
    return `${prefix}/products${qs ? `?${qs}` : ""}`;
  }

  return (
    <div lang={LOCALE_HTML_LANG[locale]} dir="ltr">
      <div className="container-page py-10 pb-12 md:py-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-graphite-soft/80 md:text-base">{t.intro}</p>

        <div className="mt-5 flex flex-wrap gap-2 md:mt-6">
          <Link
            href={listHref(undefined, inStockOnly)}
            className={cx(
              "rounded-full border px-4 py-2 text-sm font-medium",
              !activeCategory
                ? "border-brand-blue bg-brand-blue-light text-brand-blue"
                : "border-line bg-white text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
            )}
          >
            {t.allCategories}
          </Link>
          {chips.map((chip) => (
            <Link
              key={chip.slug}
              href={listHref(chip.slug, inStockOnly)}
              className={cx(
                "rounded-full border px-4 py-2 text-sm font-medium",
                activeCategory === chip.slug
                  ? "border-brand-blue bg-brand-blue-light text-brand-blue"
                  : "border-line bg-white text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
              )}
            >
              {chip.name}
            </Link>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-graphite-soft/70">{t.productsCount(localized.length)}</p>
          <Link
            href={listHref(activeCategory, !inStockOnly)}
            className={cx(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              inStockOnly
                ? "border-success bg-success-bg text-success"
                : "border-line bg-white text-graphite hover:bg-surface"
            )}
          >
            {t.inStockOnly}
          </Link>
        </div>

        <div className="mt-3 md:mt-4">
          <ProductGrid products={localized} />
        </div>

        <p className="mt-8 text-xs text-graphite-soft/50">{t.mtNote}</p>
      </div>
    </div>
  );
}

export function LocaleProductDetailPage({
  locale,
  product,
  related,
  sameBrand,
}: {
  locale: UiLocale;
  product: Product;
  related: Product[];
  sameBrand: Product[];
}) {
  const t = CATALOG_TEXT[locale];
  const localized = localizeProduct(product, locale);
  const whatsappMessage = buildWhatsAppProductMessage(localized, locale);

  return (
    <div lang={LOCALE_HTML_LANG[locale]} dir="ltr">
      <JsonLd
        data={itemPageJsonLd({
          name: localized.name,
          description: localized.description,
          path: `${LOCALE_PREFIX[locale]}/products/${product.slug}`,
          imageUrl: localized.imageUrl,
        })}
      />
      <div className="container-page py-10 pb-16 md:py-12">
        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface md:rounded-3xl">
            <Image
              src={localized.imageUrl || "/images/product-placeholder.svg"}
              alt={`${localized.name} — ${BUSINESS.nameEn}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cx("object-contain p-6 md:p-8", !localized.imageUrl && "opacity-40")}
              priority
            />
          </div>

          <div>
            {localized.brand && <p className="text-sm font-semibold text-brand-blue">{localized.brand}</p>}
            <h1 className="mt-1 text-xl font-bold text-graphite md:text-3xl">{localized.name}</h1>

            <div className="mt-2.5 flex flex-wrap items-center gap-2.5 md:mt-3 md:gap-3">
              <AvailabilityBadge availability={localized.availability} locale={locale} />
              {localized.category && <span className="text-sm text-graphite-soft/70">{localized.category}</span>}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-graphite-soft/60">{t.model}</dt>
                <dd className="font-medium text-graphite">{localized.modelNumber}</dd>
              </div>
              {localized.originCountry && (
                <div>
                  <dt className="text-graphite-soft/60">{t.origin}</dt>
                  <dd className="font-medium text-graphite" lang="he" dir="rtl">
                    {localized.originCountry}
                  </dd>
                </div>
              )}
            </dl>

            <p className="mt-4 text-[15px] leading-relaxed text-graphite-soft/90 md:mt-5 md:text-base">
              {localized.description}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-7">
              <AddToRequestButton product={localized} className="flex-1" />
              <WhatsAppButton
                message={whatsappMessage}
                label={localized.availability === "out_of_stock" ? t.whatsappCheck : t.whatsappOrder}
                className="flex-1"
                trackAs="whatsapp_click_product"
                trackSlug={localized.slug}
              />
            </div>
            <PhoneButton phone={BUSINESS.phoneDisplay} label={t.call} className="mt-3 w-full sm:w-auto" />

            <p className="mt-4 text-xs text-graphite-soft/60">{t.notice}</p>
          </div>
        </div>

        {localized.specs.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="text-lg font-bold text-graphite md:text-2xl">
              {t.specs}
            </h2>
            {/* Spec labels/values come from the Hebrew catalog feed — rendered RTL. */}
            <div className="mt-3 overflow-hidden rounded-2xl border border-line md:mt-4" lang="he" dir="rtl">
              <table className="w-full text-[13px] md:text-sm">
                <tbody>
                  {localized.specs.map((spec, index) => (
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

        {localized.capabilities.length > 0 && (
          <section className="mt-8 md:mt-10" aria-labelledby="capabilities-heading">
            <h2 id="capabilities-heading" className="text-lg font-bold text-graphite md:text-2xl">
              {t.capabilities}
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:mt-4" lang="he" dir="rtl">
              {localized.capabilities.map((capability, index) => (
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
              {t.related}
            </h2>
            <div className="mt-3 md:mt-4">
              <ProductGrid products={localizeProducts(related, locale)} />
            </div>
          </section>
        )}

        {sameBrand.length > 0 && localized.brand && (
          <section className="mt-10 md:mt-14" aria-labelledby="brand-heading">
            <h2 id="brand-heading" className="text-lg font-bold text-graphite md:text-2xl">
              {t.sameBrand(localized.brand)}
            </h2>
            <div className="mt-3 md:mt-4">
              <ProductGrid products={localizeProducts(sameBrand, locale)} />
            </div>
          </section>
        )}

        <p className="mt-8 text-xs text-graphite-soft/50">{t.mtNote}</p>
      </div>
    </div>
  );
}
