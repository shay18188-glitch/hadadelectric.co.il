import Link from "next/link";
import { ProductGrid } from "@/components/ProductGrid";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { ViewTracker } from "@/components/ViewTracker";
import { localizeProducts, localizeCategoryName, hasGuideTranslation, localizeGuide } from "@/lib/i18n/translated";
import { guidesForCategory } from "@/content/guides";
import { LOCALE_HTML_LANG, LOCALE_PREFIX, type Locale } from "@/lib/i18n/locales";
import { BUSINESS, cx } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";

type UiLocale = Exclude<Locale, "he">;

/**
 * Category pages for the non-Hebrew locales.
 *
 * The site shipped /en and /ru variants of the home page, the guides and every
 * product — but not of the category, which is the page a shopper actually
 * lands on for "стиральная машина купить в израиле". Search Console for the
 * 68 days to 2026-09-09 makes the case: /ru pages average position 8.0 at a
 * 3.12% click rate, the best of any template after the home page, while the
 * Hebrew /categories/ pages convert at 3.25% — higher than product pages — on
 * only 707 impressions. Russian demand plus the best-converting template had
 * no URL to meet at.
 *
 * Everything rendered here is already-translated data: category names and
 * product copy from the committed translation stores, guides only where a real
 * translation exists. Nothing is machine-translated at request time and no
 * Hebrew prose is served under an `hreflang` that promises otherwise.
 */
const CATEGORY_TEXT: Record<UiLocale, {
  indexTitle: string;
  indexIntro: string;
  productsCount: (n: number) => string;
  inStockOnly: string;
  allProducts: string;
  browse: string;
  guidesTitle: (category: string) => string;
  deliveryTitle: string;
  deliveryBody: (category: string) => string;
  ctaTitle: (category: string) => string;
  ctaBody: string;
  whatsapp: string;
  call: string;
  otherCategories: string;
  empty: string;
  mtNote: string;
}> = {
  en: {
    indexTitle: "Appliance categories",
    indexIntro:
      "Every category we stock, from refrigerators and washing machines to air conditioners and televisions. Pick a category to see the live catalog, then message us for an exact availability check and a personal quote.",
    productsCount: (n) => (n === 1 ? "1 product" : `${n} products`),
    inStockOnly: "In stock only",
    allProducts: "All products",
    browse: "Browse the full catalog",
    guidesTitle: (category) => `Guides for ${category.toLowerCase()}`,
    deliveryTitle: "Delivery and installation across northern Israel",
    deliveryBody: (category) =>
      `We deliver and install ${category.toLowerCase()} throughout the north — Nahariya, Acre, the Krayot, Haifa, Karmiel, Ma'alot-Tarshiha, Safed, Tiberias and the surrounding towns. Collection from our Nahariya shop is always an option.`,
    ctaTitle: (category) => `Looking for a specific ${category.toLowerCase()} model?`,
    ctaBody:
      "Send us the model, the niche measurements or just what the appliance needs to do. We check real stock and answer with a price — in English, Hebrew or Russian.",
    whatsapp: "Ask on WhatsApp",
    call: "Call the shop",
    otherCategories: "Other categories",
    empty: "Nothing in this category right now. Message us — stock changes weekly.",
    mtNote: "Product names and descriptions are translated automatically; technical specifications may appear in Hebrew.",
  },
  ru: {
    indexTitle: "Категории бытовой техники",
    indexIntro:
      "Все категории, которые есть у нас в наличии — от холодильников и стиральных машин до кондиционеров и телевизоров. Выберите категорию, чтобы посмотреть актуальный каталог, и напишите нам для точной проверки наличия и персональной цены.",
    productsCount: (n) => `Товаров: ${n}`,
    inStockOnly: "Только в наличии",
    allProducts: "Весь каталог",
    browse: "Смотреть весь каталог",
    guidesTitle: (category) => `Гиды: ${category.toLowerCase()}`,
    deliveryTitle: "Доставка и установка по северу Израиля",
    deliveryBody: (category) =>
      `Мы доставляем и устанавливаем ${category.toLowerCase()} по всему северу — Нагария, Акко, Крайот, Хайфа, Кармиэль, Маалот-Таршиха, Цфат, Тверия и окрестности. Забрать из магазина в Нагарии тоже можно в любой момент.`,
    ctaTitle: (category) => `Ищете конкретную модель — ${category.toLowerCase()}?`,
    ctaBody:
      "Напишите нам модель, размеры ниши или просто то, что техника должна уметь. Мы проверим реальное наличие и ответим с ценой — по-русски, на иврите или по-английски.",
    whatsapp: "Спросить в WhatsApp",
    call: "Позвонить в магазин",
    otherCategories: "Другие категории",
    empty: "Сейчас в этой категории пусто. Напишите нам — наличие меняется каждую неделю.",
    mtNote: "Названия и описания товаров переведены автоматически; технические характеристики могут отображаться на иврите.",
  },
};

export function LocaleCategoriesIndexPage({
  locale,
  categories,
}: {
  locale: UiLocale;
  categories: Category[];
}) {
  const t = CATEGORY_TEXT[locale];
  const prefix = LOCALE_PREFIX[locale];

  return (
    <div lang={LOCALE_HTML_LANG[locale]} dir="ltr">
      <div className="container-page py-10 pb-12 md:py-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">{t.indexTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm text-graphite-soft/80 md:text-base">{t.indexIntro}</p>

        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const name = localizeCategoryName(category.slug, category.name, locale) ?? category.name;
            return (
              <li key={category.slug}>
                <Link
                  href={`${prefix}/categories/${category.slug}`}
                  className="flex items-baseline justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
                >
                  <span>{name}</span>
                  <span className="shrink-0 text-xs text-graphite-soft/60">{category.productCount}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-sm">
          <Link href={`${prefix}/products`} className="font-semibold text-brand-blue hover:underline">
            {t.browse}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function LocaleCategoryPage({
  locale,
  category,
  products,
  otherCategories,
  inStockOnly,
}: {
  locale: UiLocale;
  category: Category;
  products: Product[];
  otherCategories: Category[];
  inStockOnly?: boolean;
}) {
  const t = CATEGORY_TEXT[locale];
  const prefix = LOCALE_PREFIX[locale];
  const name = localizeCategoryName(category.slug, category.name, locale) ?? category.name;

  const filtered = inStockOnly ? products.filter((p) => p.availability === "in_stock") : products;
  const localized = localizeProducts(filtered, locale);

  // Only guides that carry a real translation for this locale: a Hebrew guide
  // linked from a Russian page is a dead end for the reader who clicks it.
  const guides = guidesForCategory(category.slug)
    .filter((guide) => hasGuideTranslation(guide.slug, locale))
    .slice(0, 4)
    .map((guide) => localizeGuide(guide, locale));

  const whatsappMessage =
    locale === "ru"
      ? `Здравствуйте! Интересует категория «${name}» на сайте. Подскажите, пожалуйста, наличие и цену.`
      : `Hello! I'm looking at the "${name}" category on your site. Could you check availability and price?`;

  return (
    <div lang={LOCALE_HTML_LANG[locale]} dir="ltr">
      <ViewTracker event="category_view" category={category.slug} />
      <div className="container-page py-10 pb-12 md:py-12 md:pb-16">
        <nav className="text-xs text-graphite-soft/70">
          <Link href={prefix || "/"} className="hover:text-brand-blue">
            {BUSINESS.nameEn}
          </Link>
          <span className="mx-1.5">/</span>
          <Link href={`${prefix}/categories`} className="hover:text-brand-blue">
            {t.indexTitle}
          </Link>
        </nav>

        <h1 className="mt-2 text-xl font-bold text-graphite md:text-4xl">{name}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-graphite-soft/70">{t.productsCount(localized.length)}</p>
          <Link
            href={`${prefix}/categories/${category.slug}${inStockOnly ? "" : "?inStock=true"}`}
            className={cx(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              inStockOnly
                ? "border-success bg-success-bg text-success"
                : "border-line bg-white text-graphite hover:bg-surface"
            )}
          >
            {inStockOnly ? t.allProducts : t.inStockOnly}
          </Link>
        </div>

        <div className="mt-4 md:mt-5">
          <ProductGrid products={localized} emptyMessage={t.empty} />
        </div>

        {guides.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="locale-category-guides">
            <h2 id="locale-category-guides" className="text-lg font-bold text-graphite md:text-2xl">
              {t.guidesTitle(name)}
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
              {guides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`${prefix}/guides/${guide.slug}`}
                    className="block rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
                  >
                    {guide.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-graphite md:mt-10 md:text-[15px]">
          <h2 className="font-semibold">{t.deliveryTitle}</h2>
          <p className="mt-1 text-graphite-soft/85">{t.deliveryBody(name)}</p>
        </section>

        <section className="mt-8 rounded-2xl border border-line bg-brand-blue-light px-5 py-5 md:mt-10">
          <h2 className="text-base font-bold text-graphite md:text-lg">{t.ctaTitle(name)}</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-graphite-soft/85">{t.ctaBody}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton
              message={whatsappMessage}
              label={t.whatsapp}
              trackAs="whatsapp_click_product"
              trackSlug={category.slug}
            />
            <PhoneButton phone={BUSINESS.phoneDisplay} label={t.call} />
          </div>
        </section>

        {otherCategories.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="locale-other-categories">
            <h2 id="locale-other-categories" className="text-lg font-bold text-graphite md:text-2xl">
              {t.otherCategories}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {otherCategories.map((other) => (
                <Link
                  key={other.slug}
                  href={`${prefix}/categories/${other.slug}`}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
                >
                  {localizeCategoryName(other.slug, other.name, locale) ?? other.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="mt-8 text-xs text-graphite-soft/50">{t.mtNote}</p>
      </div>
    </div>
  );
}
