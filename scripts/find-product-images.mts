/**
 * Image-finder bot for catalog products that have no image.
 *
 * The catalog barely changes, so results are cached in a committed JSON store
 * (content/product-images.json) and only products that are still missing an
 * image are searched. Reruns are cheap: found images are kept forever, and
 * "not found" verdicts are retried only after NOT_FOUND_TTL_DAYS.
 *
 * Search backend: Google Programmable Search (Custom Search JSON API) in
 * image mode — free for 100 queries/day, which covers this catalog many
 * times over (~25 missing images as of July 2026, 1-2 queries each).
 *
 * Setup (one time, free):
 *   1. Create a Programmable Search Engine at https://programmablesearchengine.google.com
 *      with "Search the entire web" + Image search enabled → copy its cx id.
 *   2. Get an API key at https://developers.google.com/custom-search/v1/introduction
 *   3. Add to .env.local:
 *        GOOGLE_CSE_API_KEY=...
 *        GOOGLE_CSE_CX=...
 *
 * Run:  npm run find-images            (search for all missing images)
 *       npm run find-images -- --dry   (keyless: list what would be searched)
 *       npm run find-images -- --retry-missing   (also retry old not-founds)
 *
 * At render time lib/base44/catalog.ts fills product.imageUrl from the store
 * for products the catalog itself has no image for (never overrides real data).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { Base44CatalogResponseSchema } from "../types/api";
import { normalizeProduct } from "../lib/normalize";

const STORE_PATH = path.join(process.cwd(), "content/product-images.json");
const NOT_FOUND_TTL_DAYS = 30;
const REQUEST_DELAY_MS = 250;
const MIN_DIMENSION = 450;

const DRY_RUN = process.argv.includes("--dry");
const RETRY_MISSING = process.argv.includes("--retry-missing");

const APP_ID = process.env.NEXT_PUBLIC_BASE44_APP_ID || "697dbf6bdde569f5ea050a4e";
const CATALOG_ENDPOINT =
  (process.env.BASE44_APP_BASE_URL || `https://base44.app/api/apps/${APP_ID}`) +
  "/functions/getProductCatalog";

/* -------------------------------------------------------------- env + store */

// tsx does not auto-load .env.local the way Next does.
function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = raw.replace(/^["']|["']$/g, "").trim();
  }
}

interface FoundImage {
  url: string;
  width: number;
  height: number;
  host: string;
  foundAt: string;
}

interface ImageStore {
  /** modelNumber (uppercase) → found image. Filled at render time when the catalog has none. */
  images: Record<string, FoundImage>;
  /** modelNumber (uppercase) → ISO date of the last failed search. */
  notFound: Record<string, string>;
}

function loadStore(): ImageStore {
  if (!existsSync(STORE_PATH)) return { images: {}, notFound: {} };
  return JSON.parse(readFileSync(STORE_PATH, "utf8")) as ImageStore;
}

function saveStore(store: ImageStore): void {
  const sorted: ImageStore = {
    images: Object.fromEntries(Object.entries(store.images).sort(([a], [b]) => a.localeCompare(b))),
    notFound: Object.fromEntries(Object.entries(store.notFound).sort(([a], [b]) => a.localeCompare(b))),
  };
  writeFileSync(STORE_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}

/* ------------------------------------------------------------------ search */

interface CseImageItem {
  link: string;
  displayLink: string;
  mime?: string;
  image?: { width?: number; height?: number };
}

// Hosts that tend to serve watermarked, tiny or hotlink-hostile images.
const BAD_HOSTS =
  /(^|\.)(pinterest|ebay|aliexpress|amazon|facebook|instagram|x|twitter|yad2|wallapop)\.(com|co\.il|net)$/i;

/** Official brand domains get a strong preference — clean studio shots. */
const BRAND_HINTS: Record<string, RegExp> = {
  samsung: /samsung\.com$/i,
  lg: /lg\.com$/i,
  bosch: /bosch-home/i,
  siemens: /siemens-home/i,
  electrolux: /electrolux/i,
  whirlpool: /whirlpool/i,
  beko: /beko/i,
  haier: /haier/i,
  hisense: /hisense/i,
  midea: /midea/i,
  westinghouse: /westinghouse|selmor/i,
  blomberg: /blomberg/i,
  miele: /miele/i,
  sharp: /sharp/i,
  toshiba: /toshiba/i,
  tornado: /tornado\.co\.il$/i,
  tadiran: /tadiran/i,
  amcor: /amcor/i,
  sauter: /sauter/i,
  delonghi: /delonghi/i,
};

function scoreCandidate(item: CseImageItem, brand: string): number {
  const width = item.image?.width ?? 0;
  const height = item.image?.height ?? 0;
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) return -1;
  if (!item.link.startsWith("https://")) return -1;

  const host = item.displayLink.toLowerCase();
  if (BAD_HOSTS.test(host)) return -1;

  // Resolution credit is capped: past ~1200px more pixels add nothing on-site.
  let score = Math.min(Math.min(width, height), 1200);

  const brandHint = BRAND_HINTS[brand.toLowerCase()];
  if (brandHint?.test(host)) score += 2000;
  if (/\.(png|webp)(\?|$)/i.test(item.link) || /png|webp/i.test(item.mime ?? "")) score += 150;

  // Squarish product shots crop best in the site's square tiles.
  const ratio = width / height;
  if (ratio > 0.6 && ratio < 1.7) score += 100;

  return score;
}

/** The image must actually load (some CDNs 403 hotlinking) and be an image. */
async function urlServesImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-2047", Accept: "image/*" },
      signal: AbortSignal.timeout(10_000),
    });
    const type = res.headers.get("content-type") ?? "";
    return (res.status === 200 || res.status === 206) && type.startsWith("image/");
  } catch {
    return false;
  }
}

async function searchImages(query: string): Promise<CseImageItem[]> {
  const params = new URLSearchParams({
    key: process.env.GOOGLE_CSE_API_KEY!,
    cx: process.env.GOOGLE_CSE_CX!,
    q: query,
    searchType: "image",
    num: "10",
    safe: "active",
  });
  const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
  if (res.status === 429) {
    throw new Error("quota_exhausted");
  }
  if (!res.ok) {
    console.error(`  CSE error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return [];
  }
  const json = (await res.json()) as { items?: CseImageItem[] };
  return json.items ?? [];
}

async function findBestImage(product: {
  brand: string | null;
  modelNumber: string;
  category: string | null;
}): Promise<FoundImage | null> {
  const brand = product.brand ?? "";
  const queries = [
    `"${product.modelNumber}" ${brand}`.trim(),
    `${brand} ${product.modelNumber} ${product.category ?? ""}`.trim(),
  ];

  for (const query of queries) {
    const items = await searchImages(query);
    const ranked = items
      .map((item) => ({ item, score: scoreCandidate(item, brand) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    for (const { item } of ranked.slice(0, 4)) {
      if (await urlServesImage(item.link)) {
        return {
          url: item.link,
          width: item.image?.width ?? 0,
          height: item.image?.height ?? 0,
          host: item.displayLink,
          foundAt: new Date().toISOString().slice(0, 10),
        };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }
  return null;
}

/* -------------------------------------------------------------------- main */

async function fetchCatalog() {
  const res = await fetch(CATALOG_ENDPOINT, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`);
  const parsed = Base44CatalogResponseSchema.parse(await res.json());
  if (!parsed.success) throw new Error(`catalog error: ${parsed.error}`);
  return parsed.data.map(normalizeProduct);
}

function daysSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / 86_400_000;
}

async function main() {
  loadEnvLocal();
  const store = loadStore();
  const products = await fetchCatalog();

  const missing = products.filter((p) => {
    if (p.imageUrl) return false;
    const key = p.modelNumber.toUpperCase();
    if (store.images[key]) return false;
    const lastMiss = store.notFound[key];
    if (lastMiss && !RETRY_MISSING && daysSince(lastMiss) < NOT_FOUND_TTL_DAYS) return false;
    return true;
  });

  console.log(
    `catalog: ${products.length} products, ${products.filter((p) => !p.imageUrl).length} without image, ` +
      `${Object.keys(store.images).length} already found, ${missing.length} to search`
  );

  if (missing.length === 0) return;

  if (DRY_RUN) {
    for (const p of missing) console.log(`  would search: ${p.brand ?? "?"} ${p.modelNumber} (${p.name})`);
    return;
  }

  if (!process.env.GOOGLE_CSE_API_KEY || !process.env.GOOGLE_CSE_CX) {
    console.error(
      "Missing GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX in .env.local — see the setup notes at the top of this script."
    );
    process.exit(1);
  }

  let found = 0;
  for (const product of missing) {
    const key = product.modelNumber.toUpperCase();
    process.stdout.write(`${product.brand ?? "?"} ${product.modelNumber} … `);
    try {
      const image = await findBestImage(product);
      if (image) {
        store.images[key] = image;
        delete store.notFound[key];
        found += 1;
        console.log(`✓ ${image.host} (${image.width}×${image.height})`);
      } else {
        store.notFound[key] = new Date().toISOString().slice(0, 10);
        console.log("✗ nothing suitable");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "quota_exhausted") {
        console.log("\nDaily CSE quota exhausted — progress saved, rerun tomorrow.");
        break;
      }
      store.notFound[key] = new Date().toISOString().slice(0, 10);
      console.log(`✗ error: ${err instanceof Error ? err.message : err}`);
    }
    saveStore(store); // flush as we go: reruns resume for free
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }

  console.log(`done: ${found}/${missing.length} images found → ${path.relative(process.cwd(), STORE_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
