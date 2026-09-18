/**
 * Dry-run the SEO metadata engine over the live catalog.
 *
 * Prints before/after titles and descriptions plus distribution stats, so a
 * template change can be inspected across all ~840 products before it ships.
 *
 *   npx tsx scripts/seo-simulate.mts            # summary + random sample
 *   npx tsx scripts/seo-simulate.mts AI16000    # one model, in all locales
 *   npx tsx scripts/seo-simulate.mts --worst    # longest / most truncated
 */

import { Base44CatalogResponseSchema } from "../types/api";
import { cleanModelNumber, normalizeProduct } from "../lib/normalize";
import type { Product } from "../types/product";
import { localizeProduct } from "../lib/i18n/translated";
import {
  productSearchTitle,
  productMetaDescription,
  productHeading,
  productFacts,
  productIdentifiers,
  type SeoLocale,
} from "../lib/seo/productNaming";

const appId = process.env.NEXT_PUBLIC_BASE44_APP_ID || "697dbf6bdde569f5ea050a4e";
const endpoint =
  (process.env.BASE44_APP_BASE_URL || `https://base44.app/api/apps/${appId}`) + "/functions/getProductCatalog";

const LOCALES: SeoLocale[] = ["he", "en", "ru"];
const TITLE_LIMIT: Record<SeoLocale, number> = { he: 65, en: 65, ru: 65 };

/** The old templates, kept here so the diff is visible rather than asserted. */
function legacyTitle(product: Product): string {
  return `${product.name} | חדד יובל אלקטריק בע״מ`;
}
function legacyDescription(product: Product): string {
  return product.description.length > 155 ? `${product.description.slice(0, 152)}...` : product.description;
}

async function loadCatalog(): Promise<Product[]> {
  const response = await fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`catalog HTTP ${response.status}`);
  const parsed = Base44CatalogResponseSchema.safeParse(await response.json());
  if (!parsed.success || !parsed.data.success) throw new Error("catalog response invalid");
  // Drop the records the per-product schema could not read.
  return parsed.data.data.filter((product) => product !== null).map(normalizeProduct);
}

function show(product: Product) {
  console.log("─".repeat(78));
  console.log(`${product.modelNumber}  ·  ${product.brand ?? "—"}  ·  ${product.category ?? "—"}  ·  ${product.availability}`);
  console.log(`  slug     ${product.slug}`);
  console.log(`  BEFORE T ${legacyTitle(product)}  [${legacyTitle(product).length}]`);
  console.log(`  BEFORE D ${legacyDescription(product).slice(0, 120)}  [${legacyDescription(product).length}]`);
  console.log(`  H1       ${productHeading(product)}`);
  for (const locale of LOCALES) {
    const localized = locale === "he" ? product : localizeProduct(product, locale);
    const title = productSearchTitle(localized, locale);
    const description = productMetaDescription(localized, locale);
    console.log(`  ${locale} T     ${title}  [${title.length}]`);
    console.log(`  ${locale} D     ${description}  [${description.length}]`);
  }
}

function summarize(products: Product[]) {
  const stats = {
    total: products.length,
    gainedBrandOrModel: 0,
    gainedNothing: 0,
    truncatedName: 0,
    droppedSiteSuffix: 0,
    overBudget: [] as string[],
    emptyFacts: 0,
    descTooLong: [] as string[],
    titleMissingModel: [] as string[],
    descMissingModel: [] as string[],
  };
  const titleLengths: number[] = [];
  const descLengths: number[] = [];

  for (const product of products) {
    const identifiers = productIdentifiers(product);
    if (identifiers) stats.gainedBrandOrModel++;
    else stats.gainedNothing++;

    const title = productSearchTitle(product, "he");
    titleLengths.push(title.length);
    if (!title.includes(product.name)) stats.truncatedName++;
    if (!title.includes("| חדד יובל אלקטריק")) stats.droppedSiteSuffix++;
    if (title.length > TITLE_LIMIT.he) stats.overBudget.push(`${product.modelNumber} [${title.length}] ${title}`);

    const description = productMetaDescription(product, "he");
    descLengths.push(description.length);
    if (description.length > 165) stats.descTooLong.push(`${product.modelNumber} [${description.length}]`);
    for (const locale of LOCALES) {
      const localized = locale === "he" ? product : localizeProduct(product, locale);
      const t = productSearchTitle(localized, locale);
      const d = productMetaDescription(localized, locale);
      // The published identifier is the manufacturer's model number, with the
      // importer's internal code stripped — that is what a searcher types.
      const model = cleanModelNumber(product.modelNumber);
      if (model && !t.includes(model)) stats.titleMissingModel.push(`${locale} ${model}`);
      if (model && !d.includes(model)) stats.descMissingModel.push(`${locale} ${model}`);
      if (t.length > TITLE_LIMIT[locale]) stats.overBudget.push(`${locale} ${product.modelNumber} [${t.length}] ${t}`);
    }
    if (productFactsCount(product) === 0) stats.emptyFacts++;
  }

  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  console.log("\n" + "═".repeat(78));
  console.log("SIMULATION SUMMARY");
  console.log("═".repeat(78));
  console.log(`products                      ${stats.total}`);
  console.log(`gained brand and/or model     ${stats.gainedBrandOrModel}  (${((100 * stats.gainedBrandOrModel) / stats.total).toFixed(1)}%)`);
  console.log(`already carried both          ${stats.gainedNothing}`);
  console.log(`name truncated to fit         ${stats.truncatedName}  (${((100 * stats.truncatedName) / stats.total).toFixed(1)}%)`);
  console.log(`store suffix dropped          ${stats.droppedSiteSuffix}`);
  console.log(`no usable facts for snippet   ${stats.emptyFacts}`);
  console.log(`title length  min/med/max     ${Math.min(...titleLengths)} / ${median(titleLengths)} / ${Math.max(...titleLengths)}`);
  console.log(`desc  length  min/med/max     ${Math.min(...descLengths)} / ${median(descLengths)} / ${Math.max(...descLengths)}`);
  console.log(`titles over budget            ${stats.overBudget.length}`);
  for (const line of stats.overBudget.slice(0, 8)) console.log(`   ! ${line}`);
  console.log(`titles missing model number   ${stats.titleMissingModel.length}`);
  for (const line of stats.titleMissingModel.slice(0, 8)) console.log(`   ! ${line}`);
  console.log(`descs  missing model number   ${stats.descMissingModel.length}`);
  for (const line of stats.descMissingModel.slice(0, 8)) console.log(`   ! ${line}`);
  console.log(`descriptions over 165 chars   ${stats.descTooLong.length}`);
  for (const line of stats.descTooLong.slice(0, 8)) console.log(`   ! ${line}`);
}

function productFactsCount(product: Product): number {
  return productFacts(product, { locale: "he" }).length;
}

async function main() {
  const products = await loadCatalog();
  const arg = process.argv[2];

  if (arg && !arg.startsWith("--")) {
    const match = products.filter((p) => p.modelNumber.toUpperCase().includes(arg.toUpperCase()));
    if (match.length === 0) return console.log(`no product matching "${arg}"`);
    match.slice(0, 5).forEach(show);
    return;
  }

  if (arg === "--worst") {
    const ranked = [...products].sort((a, b) => productSearchTitle(b, "he").length - productSearchTitle(a, "he").length);
    ranked.slice(0, 12).forEach(show);
    summarize(products);
    return;
  }

  // Deterministic spread across the catalog rather than a random draw, so
  // repeated runs are comparable.
  const step = Math.floor(products.length / 12) || 1;
  products.filter((_, i) => i % step === 0).slice(0, 12).forEach(show);
  summarize(products);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
