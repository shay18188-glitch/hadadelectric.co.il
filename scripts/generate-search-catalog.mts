import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Base44CatalogResponseSchema } from "../types/api";
import { normalizeProduct } from "../lib/normalize";
import type { Product } from "../types/product";
import { toSearchableProducts } from "../lib/search/searchBlob";

const DEFAULT_APP_ID = "697dbf6bdde569f5ea050a4e";
const appId = process.env.NEXT_PUBLIC_BASE44_APP_ID || DEFAULT_APP_ID;
const baseUrl = process.env.BASE44_APP_BASE_URL || `https://base44.app/api/apps/${appId}`;
const endpoint = `${baseUrl}/functions/getProductCatalog`;
const outputPath = resolve(process.cwd(), "content/search-catalog.json");
// The raw feed exactly as Base44 sent it, kept for request-time renders to
// fall back on when Base44 is down or rate-limited (see lib/base44/catalog.ts).
// Generated on every build, never committed.
const snapshotDir = resolve(process.cwd(), "content/.generated");
const snapshotPath = resolve(snapshotDir, "catalog-snapshot.json");
const imageStorePath = resolve(process.cwd(), "content/product-images.json");

async function existingSeedIsAvailable(): Promise<boolean> {
  try {
    const current = JSON.parse(await readFile(outputPath, "utf8")) as { products?: unknown[] };
    return Array.isArray(current.products) && current.products.length > 0;
  } catch {
    return false;
  }
}

async function main() {
  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`catalog returned HTTP ${response.status}`);

    const rawJson: unknown = await response.json();
    const parsed = Base44CatalogResponseSchema.safeParse(rawJson);
    if (!parsed.success || !parsed.data.success || parsed.data.data.length === 0) {
      throw new Error("catalog response was empty or invalid");
    }
    await mkdir(snapshotDir, { recursive: true });
    await writeFile(snapshotPath, JSON.stringify(rawJson), "utf8");

    const imageStore = JSON.parse(await readFile(imageStorePath, "utf8")) as {
      images?: Record<string, { url?: string }>;
    };
    const imageOverrides = imageStore.images ?? {};
    const usable = parsed.data.data.filter((product) => product !== null);
    if (usable.length < parsed.data.data.length) {
      console.warn(`[search-catalog] skipped ${parsed.data.data.length - usable.length} unparseable record(s)`);
    }
    const products: Product[] = usable.map(normalizeProduct).map((product) => {
      if (product.imageUrl) return product;
      const override = imageOverrides[product.modelNumber.toUpperCase()]?.url;
      return override ? { ...product, imageUrl: override } : product;
    });

    const searchableProducts = toSearchableProducts(products).map((product) => ({
      modelNumber: product.modelNumber,
      name: product.name,
      brand: product.brand,
      brandSlug: product.brandSlug,
      category: product.category,
      categorySlug: product.categorySlug,
      imageUrl: product.imageUrl,
      originCountry: null,
      specs: [],
      capabilities: [],
      // Emptied like the fields above: autocomplete renders a name, a thumb
      // and a link, so shipping every gallery URL and every expert note in
      // the function bundle would cost weight nothing in this path reads.
      images: [],
      expertNote: null,
      description: "",
      availability: product.availability,
      slug: product.slug,
      searchBlob: product.searchBlob,
    }));

    // The engine (lib/search/engine.ts) builds its own token index at
    // start-up in a few milliseconds, so no serialized index is shipped.
    const nextContents = `${JSON.stringify({ products: searchableProducts })}\n`;
    const previousContents = await readFile(outputPath, "utf8").catch(() => "");
    if (previousContents !== nextContents) {
      await writeFile(outputPath, nextContents, "utf8");
    }
    console.log(`[search-catalog] ready with ${products.length} products`);
  } catch (error) {
    if (await existingSeedIsAvailable()) {
      console.warn(`[search-catalog] refresh failed; using committed seed (${String(error)})`);
      return;
    }
    throw error;
  }
}

await main();
