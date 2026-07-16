/**
 * Image-finder bot for catalog products that have no image.
 *
 * The catalog barely changes, so results are cached in a committed JSON store
 * (content/product-images.json) and only products that are still missing an
 * image are searched. Reruns are cheap: found images are kept forever, and
 * "not found" verdicts are retried only after NOT_FOUND_TTL_DAYS.
 *
 * Search backend: Gemini with Google Search grounding — the model searches the
 * web for the product and returns direct image URLs; the script then verifies
 * each candidate actually serves a real image, sniffs its true dimensions from
 * the file bytes, and picks the best one (official brand domains preferred,
 * marketplaces banned, minimum resolution enforced).
 *
 * Setup (one time, free tier is plenty for this catalog):
 *   1. Get an API key at https://aistudio.google.com/apikey
 *   2. Add to .env.local:  GEMINI_API_KEY=...
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
const MIN_DIMENSION = 450;
// Free-tier Gemini allows ~10 requests/minute with grounding; stay well under.
const GEMINI_DELAY_MS = 7000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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

/* -------------------------------------------- image probing (bytes → dims) */

interface ProbedImage {
  width: number;
  height: number;
  bytes: number;
}

function u16be(b: Uint8Array, i: number): number {
  return (b[i] << 8) | b[i + 1];
}
function u32be(b: Uint8Array, i: number): number {
  return (b[i] * 0x1000000 + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3]) >>> 0;
}
function u16le(b: Uint8Array, i: number): number {
  return b[i] | (b[i + 1] << 8);
}
function u24le(b: Uint8Array, i: number): number {
  return b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
}

/** Parse width/height straight from the file header (PNG/JPEG/WebP/GIF). */
function sniffDimensions(b: Uint8Array): { width: number; height: number } | null {
  // PNG: signature + IHDR
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { width: u32be(b, 16), height: u32be(b, 20) };
  }
  // JPEG: scan for a SOFn marker
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = b[i + 1];
      if (marker === 0xff) {
        i += 1;
        continue;
      }
      // Standalone markers without a length segment
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9) || marker === 0x01) {
        i += 2;
        continue;
      }
      const length = u16be(b, i + 2);
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) {
        return { width: u16be(b, i + 7), height: u16be(b, i + 5) };
      }
      i += 2 + length;
    }
    return null;
  }
  // WebP: RIFF....WEBP + VP8/VP8L/VP8X chunk
  if (
    b.length > 30 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    const chunk = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (chunk === "VP8X") return { width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 };
    if (chunk === "VP8 ") return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
    if (chunk === "VP8L") {
      const n = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return { width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 };
    }
    return null;
  }
  // GIF
  if (b.length > 10 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) {
    return { width: u16le(b, 6), height: u16le(b, 8) };
  }
  return null;
}

/**
 * The image must actually load (some CDNs 403 hotlinking) and be a real image;
 * dimensions are read from the first bytes of the file itself.
 */
async function probeImage(url: string): Promise<ProbedImage | null> {
  try {
    const res = await fetch(url, {
      headers: { Range: "bytes=0-131071", Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; image-probe)" },
      signal: AbortSignal.timeout(12_000),
    });
    if (res.status !== 200 && res.status !== 206) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return null;

    const buf = new Uint8Array(await res.arrayBuffer());
    const dims = sniffDimensions(buf);
    const total = Number(res.headers.get("content-range")?.split("/")[1] ?? res.headers.get("content-length") ?? buf.length);
    if (dims) return { ...dims, bytes: total };
    // Couldn't parse the header (exotic format / SOF very deep): accept only
    // if the file is big enough that it's plausibly a full-size photo.
    return total >= 100_000 ? { width: 0, height: 0, bytes: total } : null;
  } catch {
    return null;
  }
}

/* ----------------------------------------------------------------- scoring */

// Hosts that tend to serve watermarked, tiny or hotlink-hostile images.
const BAD_HOSTS =
  /(^|\.)(pinterest|ebay|aliexpress|amazon|facebook|instagram|x|twitter|yad2|wallapop)\.(com|co\.il|net)$/i;

/** Official brand domains get a strong preference — clean studio shots. */
const BRAND_HINTS: Record<string, RegExp> = {
  samsung: /samsung\.com$/i,
  lg: /lg\.com$/i,
  tcl: /tcl\.com$/i,
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
  magimix: /magimix/i,
  panasonic: /panasonic/i,
};

function scoreCandidate(url: string, probe: ProbedImage, brand: string): number {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return -1;
  }
  if (!url.startsWith("https://")) return -1;
  if (BAD_HOSTS.test(host)) return -1;
  if (probe.width > 0 && (probe.width < MIN_DIMENSION || probe.height < MIN_DIMENSION)) return -1;

  // Resolution credit is capped: past ~1200px more pixels add nothing on-site.
  let score = probe.width > 0 ? Math.min(Math.min(probe.width, probe.height), 1200) : 500;

  const brandHint = BRAND_HINTS[brand.toLowerCase()];
  if (brandHint?.test(host)) score += 2000;
  if (/\.(png|webp)(\?|$)/i.test(url)) score += 150;

  // Squarish product shots crop best in the site's square tiles.
  if (probe.width > 0) {
    const ratio = probe.width / probe.height;
    if (ratio > 0.6 && ratio < 1.7) score += 100;
  }

  return score;
}

/* ------------------------------------------------------- gemini web search */

async function geminiFindImageUrls(product: {
  brand: string | null;
  modelNumber: string;
  category: string | null;
  name: string;
}): Promise<string[]> {
  const prompt = [
    "Find the official product photo for this home appliance sold in Israel:",
    `Brand: ${product.brand ?? "unknown"}`,
    `Model number: ${product.modelNumber}`,
    `Product: ${product.name}${product.category ? ` (${product.category})` : ""}`,
    "",
    "Search the web for this exact model. Respond with up to 6 DIRECT image file URLs",
    "(the .jpg/.png/.webp file itself, not an HTML page), one per line, best first.",
    "Prefer the manufacturer's official site, then Israeli retailer product images.",
    "The photo must show this product alone on a clean background. If you cannot",
    "find any, respond with exactly: NONE",
  ].join("\n");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(90_000),
    }
  );

  if (res.status === 429) throw new Error("quota_exhausted");
  if (!res.ok) {
    console.error(`  gemini error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return [];
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("\n");

  const urls = Array.from(text.matchAll(/https:\/\/[^\s"'<>()\]]+/g), (m) => m[0])
    // Grounding responses often append citation redirect links — drop them.
    .filter((u) => !u.includes("vertexaisearch") && !u.includes("google.com/search"))
    .map((u) => u.replace(/[.,;:!?]+$/, ""));
  return Array.from(new Set(urls)).slice(0, 6);
}

async function findBestImage(product: {
  brand: string | null;
  modelNumber: string;
  category: string | null;
  name: string;
}): Promise<FoundImage | null> {
  const candidates = await geminiFindImageUrls(product);

  let best: { url: string; probe: ProbedImage; score: number } | null = null;
  for (const url of candidates) {
    const probe = await probeImage(url);
    if (!probe) continue;
    const score = scoreCandidate(url, probe, product.brand ?? "");
    if (score > 0 && (!best || score > best.score)) best = { url, probe, score };
  }

  if (!best) return null;
  return {
    url: best.url,
    width: best.probe.width,
    height: best.probe.height,
    host: new URL(best.url).hostname,
    foundAt: new Date().toISOString().slice(0, 10),
  };
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

  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "Missing GEMINI_API_KEY in .env.local — get a free key at https://aistudio.google.com/apikey"
    );
    process.exit(1);
  }

  let found = 0;
  for (const [index, product] of missing.entries()) {
    const key = product.modelNumber.toUpperCase();
    process.stdout.write(`${product.brand ?? "?"} ${product.modelNumber} … `);
    try {
      const image = await findBestImage(product);
      if (image) {
        store.images[key] = image;
        delete store.notFound[key];
        found += 1;
        console.log(`✓ ${image.host}${image.width ? ` (${image.width}×${image.height})` : ""}`);
      } else {
        store.notFound[key] = new Date().toISOString().slice(0, 10);
        console.log("✗ nothing suitable");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "quota_exhausted") {
        console.log("\nGemini rate/quota limit hit — progress saved, rerun later.");
        break;
      }
      store.notFound[key] = new Date().toISOString().slice(0, 10);
      console.log(`✗ error: ${err instanceof Error ? err.message : err}`);
    }
    saveStore(store); // flush as we go: reruns resume for free
    if (index < missing.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, GEMINI_DELAY_MS));
    }
  }

  console.log(`done: ${found}/${missing.length} images found → ${path.relative(process.cwd(), STORE_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
