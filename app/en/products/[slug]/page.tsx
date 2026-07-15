import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getProductBySlug, getProductsBySameBrand, getRelatedProducts } from "@/lib/base44/catalog";
import { LocaleProductDetailPage } from "@/components/i18n/LocaleCatalog";
import { localizeProduct } from "@/lib/i18n/translated";
import { buildMetadata } from "@/lib/seo/metadata";
import { translationsForPath } from "@/lib/i18n/locales";

// Rendered on demand (no generateStaticParams): translated product pages are
// cached via ISR instead of pre-building ~830 extra pages per locale.
export const revalidate = 10800; // 3 hours

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));
  if (!product) return {};
  const localized = localizeProduct(product, "en");
  const description =
    localized.description.length > 155 ? `${localized.description.slice(0, 152)}...` : localized.description;
  return buildMetadata({
    title: localized.name,
    description,
    path: `/en/products/${product.slug}`,
    locale: "en",
    translations: translationsForPath(`/products/${product.slug}`) ?? undefined,
    images: product.imageUrl ? [product.imageUrl] : undefined,
  });
}

export default async function EnglishProductPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const product = await getProductBySlug(decodedSlug);
  if (!product) notFound();
  if (product.slug !== decodedSlug) permanentRedirect(`/en/products/${product.slug}`);

  const [related, sameBrand] = await Promise.all([
    getRelatedProducts(product, 4),
    getProductsBySameBrand(product, 4),
  ]);

  return <LocaleProductDetailPage locale="en" product={product} related={related} sameBrand={sameBrand} />;
}
