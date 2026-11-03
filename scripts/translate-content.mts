/**
 * Incremental machine-translation pipeline for guides + catalog (he → en/ru).
 *
 * The catalog barely changes, so translations are cached in committed JSON
 * stores under content/i18n/translations/ and only missing or changed source
 * texts (detected by content hash) are sent to the translation API. Reruns
 * are cheap and resumable — the store is flushed to disk as it fills.
 *
 * Run:  npm run translate            (translate everything missing/stale)
 *       npm run translate -- --dry   (report what would be translated)
 *
 * At render time, anything without a translation simply falls back to the
 * Hebrew source (see lib/i18n/translated.ts).
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { GUIDES } from "../content/guides";
import { NATIVE_RU_GUIDES } from "../content/i18n/native/guides.ru";
import { normalizeProduct } from "../lib/normalize";
import { Base44CatalogResponseSchema } from "../types/api";

const OUT_DIR = path.join(process.cwd(), "content/i18n/translations");
const LOCALES = ["en", "ru"] as const;
type TargetLocale = (typeof LOCALES)[number];

const DRY_RUN = process.argv.includes("--dry");

/**
 * Scope flags.
 *
 * The two halves of this job have very different shapes. Guides are a couple
 * of dozen documents that change when someone edits them; the catalog is
 * ~937 products whose hashes all invalidate at once whenever the normalizer's
 * description template changes, which turns a routine guide update into
 * thousands of requests against an endpoint that will rate-limit long before
 * it finishes. Being able to run one half alone keeps a small edit small.
 */
const ONLY_GUIDES = process.argv.includes("--guides");
const ONLY_CATALOG = process.argv.includes("--catalog");

/**
 * Translate only what the shop can actually sell.
 *
 * Every product hash invalidates at once whenever the normalizer's description
 * template changes, so a full catalog run is ~3,700 requests against an
 * endpoint that rate-limits long before it finishes — and it spends most of
 * them on models that are out of stock and cannot convert. Restricting to
 * in-stock records covers the pages a visitor can act on and keeps the run
 * short enough to complete in one go.
 */
const IN_STOCK_ONLY = process.argv.includes("--in-stock");

/**
 * Cap how many products a single run will attempt, e.g. `--limit 150`.
 *
 * The free endpoint returns 429 somewhere past a couple of thousand requests
 * and then refuses everything for a while, so a 678-product catalog cannot be
 * translated in one pass. Because the store is keyed by content hash, a capped
 * run is not a partial failure — it is a batch, and the next run picks up where
 * this one stopped.
 */
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  const v = i >= 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : null;
})();

/** Restrict to one target locale, e.g. `--locale ru`, halving a run. */
const LOCALE_ARG: TargetLocale | null = (() => {
  const i = process.argv.indexOf("--locale");
  const v = i >= 0 ? process.argv[i + 1] : undefined;
  if (v === "en") return "en";
  if (v === "ru") return "ru";
  return null;
})();
// tsx does not read env files; pick up DEEPL_API_KEY etc. from .env.local.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

/**
 * DeepL when a key is configured, the free Google endpoint otherwise.
 *
 * The Google endpoint is unauthenticated and starts answering 429 a couple of
 * thousand requests in, which is why the catalog was never finished. DeepL's
 * API is keyed and metered instead of throttled, so a full run completes.
 * Free-plan keys end in ":fx" and are served from a separate host.
 */
const DEEPL_KEY = process.env.DEEPL_API_KEY?.trim() || null;
const DEEPL_API = DEEPL_KEY?.endsWith(":fx") ? "https://api-free.deepl.com/v2" : "https://api.deepl.com/v2";
const DEEPL_TARGET: Record<TargetLocale, string> = { en: "EN-US", ru: "RU" };

/**
 * Israeli retail Hebrew that DeepL reads literally.
 *
 * Every entry was a real mistranslation in a sample of one product per
 * category: "מכונת ברד" became a machine that makes hail, "מסך" a bare screen
 * rather than a TV, "מצנן אוויר" an air conditioner, "מיחם" a kettle, and
 * "כ״ס" came out as the Ukrainian abbreviation. A hint in DeepL's `context`
 * field fixed some of these and not others, and a longer hint made it worse;
 * a glossary is applied every time.
 */
const GLOSSARY: [he: string, en: string, ru: string][] = [
  ["מסך", "TV", "телевизор"],
  ["מכונת ברד", "ice maker", "льдогенератор"],
  ["מכונת ברד ביתית", "home ice maker", "бытовой льдогенератор"],
  ["כיריים", "cooktop", "варочная панель"],
  ["מייבש כביסה", "tumble dryer", "сушильная машина"],
  ["מצנן אוויר", "air cooler", "охладитель воздуха"],
  ["מיחם", "hot water urn", "термопот"],
  ["סיר לטיגון באוויר חם", "air fryer", "аэрогриль"],
  ["טוסטר אובן", "toaster oven", "мини-печь"],
  ["מסלסל", "hair curler", "стайлер для завивки"],
  ["NF", "No Frost", "с системой No Frost"],
  ['כ"ס', "HP", "л.с."],
  ["שלוחה", "additional handset", "дополнительная трубка"],
  ["בידורית", "party speaker", "колонка для вечеринок"],
  ["סיר לטיגון עמוק", "deep fryer", "фритюрница"],
  ["פינג'אן", "finjan", "финджан"],
  // Category name in the feed, spelled as a plural of "אופה". Read as "the
  // character of bread" without this.
  ["אופי לחם", "bread makers", "хлебопечки"],
];

const DEEPL_CONTEXT = "Product catalog and buying guides of a home-appliance store in Israel, in Israeli retail Hebrew.";

/**
 * One glossary per target locale, named after a hash of its entries, so an
 * edit to GLOSSARY creates a fresh glossary instead of reusing a stale one.
 * Superseded glossaries from earlier runs are removed.
 */
const glossaryIds = new Map<TargetLocale, Promise<string>>();

function glossaryFor(target: TargetLocale): Promise<string> {
  let id = glossaryIds.get(target);
  if (!id) {
    id = ensureGlossary(target);
    glossaryIds.set(target, id);
  }
  return id;
}

async function ensureGlossary(target: TargetLocale): Promise<string> {
  const col = target === "ru" ? 2 : 1;
  const tsv = GLOSSARY.map((row) => `${row[0]}\t${row[col]}`).join("\n");
  const prefix = `hadad-he-${target}-`;
  const name = prefix + hashOf(tsv);
  const headers = { Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`, "Content-Type": "application/json" };

  const list = (await (await fetch(`${DEEPL_API}/glossaries`, { headers })).json()) as {
    glossaries: { glossary_id: string; name: string }[];
  };
  for (const g of list.glossaries) {
    if (g.name.startsWith(prefix) && g.name !== name) {
      await fetch(`${DEEPL_API}/glossaries/${g.glossary_id}`, { method: "DELETE", headers });
    }
  }
  const existing = list.glossaries.find((g) => g.name === name);
  if (existing) return existing.glossary_id;

  const create = () =>
    fetch(`${DEEPL_API}/glossaries`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, source_lang: "he", target_lang: target, entries: tsv, entries_format: "tsv" }),
    });
  let res = await create();
  // The free plan holds a single glossary, so the other locale's copy has to
  // make room. Nothing is lost: every hadad-he-* glossary is rebuilt from
  // GLOSSARY on the run that needs it. Locales run one after another, so the
  // glossary removed here is never one still in use.
  if (res.status === 456) {
    for (const g of list.glossaries) {
      if (g.name.startsWith("hadad-he-") && !g.name.startsWith(prefix)) {
        await fetch(`${DEEPL_API}/glossaries/${g.glossary_id}`, { method: "DELETE", headers });
        glossaryIds.delete(g.name.startsWith("hadad-he-ru-") ? "ru" : "en");
      }
    }
    res = await create();
  }
  if (!res.ok) throw new Error(`DeepL glossary creation failed (${res.status}): ${await res.text()}`);
  return ((await res.json()) as { glossary_id: string }).glossary_id;
}

/** Deterministic touch-ups for what a glossary cannot express. */
function tidy(text: string, target: TargetLocale, source: string): string {
  // A glossary term that opens the text keeps the glossary's lower case.
  let out = text.charAt(0).toUpperCase() + text.slice(1);
  // "מסך" is a TV except where it is not: a computer monitor filed under TVs,
  // or a device "with a screen". The glossary cannot see that; the source can.
  const tv = target === "ru" ? /телевизор/g : /\bTV\b/g;
  if (/monitor/i.test(source)) out = out.replace(tv, target === "ru" ? "монитор" : "monitor");
  if (/עם מסך/.test(source)) {
    out = target === "ru" ? out.replace(/телевизор/g, "экран") : out.replace(/\bTV\b/g, "screen");
  }
  if (target !== "ru") return out;
  // Glossary targets at the start of a sentence come back capitalised in Latin.
  return out.replace(/\bMini-печь/g, "Мини-печь").replace(/модель с системой No Frost/g, "с системой No Frost");
}

const CONCURRENCY = 6;
const REQUEST_DELAY_MS = DEEPL_KEY ? 0 : 120;
const APP_ID = process.env.NEXT_PUBLIC_BASE44_APP_ID || "697dbf6bdde569f5ea050a4e";
const CATALOG_ENDPOINT =
  (process.env.BASE44_APP_BASE_URL || `https://base44.app/api/apps/${APP_ID}`) + "/functions/getProductCatalog";

/* ------------------------------------------------------------------ store */

interface GuideTranslation {
  h: string;
  title: string;
  description: string;
  sections: { heading?: string; paragraphs: string[] }[];
  faq?: { question: string; answer: string }[];
}

interface ProductTranslation {
  h: string;
  name: string;
  description: string;
}

interface GuidesStore {
  entries: Record<string, GuideTranslation>;
}

interface CatalogStore {
  products: Record<string, ProductTranslation>;
  categories: Record<string, { h: string; name: string }>;
}

function hashOf(...parts: (string | undefined)[]): string {
  return createHash("sha1").update(parts.map((p) => p ?? "").join(" ")).digest("hex").slice(0, 12);
}

function loadStore<T>(file: string, empty: T): T {
  const p = path.join(OUT_DIR, file);
  if (!existsSync(p)) return empty;
  return JSON.parse(readFileSync(p, "utf8")) as T;
}

function saveStore(file: string, data: unknown): void {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, file), JSON.stringify(data, null, 1) + "\n");
}

/* -------------------------------------------------------------- translate */

let requestCount = 0;
let billedChars = 0;

async function translateText(text: string, target: TargetLocale, attempt = 0): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;
  // Skip pure Latin/numeric strings (model numbers etc.) — nothing to translate.
  if (!/[֐-׿]/.test(trimmed)) return trimmed;

  if (DEEPL_KEY) return translateDeepL(trimmed, target, attempt);

  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=iw&dt=t" +
    `&tl=${target}&q=${encodeURIComponent(trimmed)}`;

  const res = await fetch(url);
  requestCount++;
  if (!res.ok) {
    if (attempt < 4) {
      await sleep(1500 * (attempt + 1));
      return translateText(text, target, attempt + 1);
    }
    throw new Error(`translate failed (${res.status}) for: ${trimmed.slice(0, 60)}`);
  }
  const data = (await res.json()) as [Array<[string, string, ...unknown[]]>, ...unknown[]];
  const out = (data[0] ?? []).map((seg) => seg[0] ?? "").join("");
  await sleep(REQUEST_DELAY_MS);
  return out.trim() || trimmed;
}

async function translateDeepL(text: string, target: TargetLocale, attempt: number): Promise<string> {
  const res = await fetch(`${DEEPL_API}/translate`, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: [text],
      source_lang: "HE",
      target_lang: DEEPL_TARGET[target],
      glossary_id: await glossaryFor(target),
      context: DEEPL_CONTEXT,
      preserve_formatting: true,
    }),
  });
  requestCount++;
  // 403 = bad key, 456 = monthly quota used up: retrying cannot help.
  if (res.status === 403 || res.status === 456) {
    throw new Error(`DeepL refused the request (${res.status}): ${await res.text()}`);
  }
  if (!res.ok) {
    if (attempt < 4) {
      await sleep(2000 * (attempt + 1));
      return translateDeepL(text, target, attempt + 1);
    }
    throw new Error(`DeepL failed (${res.status}) for: ${text.slice(0, 60)}`);
  }
  const data = (await res.json()) as { translations: { text: string }[] };
  billedChars += text.length;
  return tidy(data.translations[0]?.text.trim() || text, target, text);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Run jobs with limited concurrency. */
async function runPool(jobs: Array<() => Promise<void>>): Promise<void> {
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++];
      await job();
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
}

/* ------------------------------------------------------------------ guides */

async function translateGuides(): Promise<void> {
  for (const locale of LOCALE_ARG ? [LOCALE_ARG] : LOCALES) {
    const file = `guides.${locale}.json`;
    const store = loadStore<GuidesStore>(file, { entries: {} });
    // Hand-written editions are never machine-translated over. See
    // content/i18n/native/guides.ru.ts for why they exist.
    const native = locale === "ru" ? NATIVE_RU_GUIDES : {};
    const stale = GUIDES.filter((g) => !native[g.slug]).filter((g) => {
      const h = hashOf(
        g.title,
        g.description,
        ...g.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
        ...(g.faq ?? []).flatMap((f) => [f.question, f.answer])
      );
      return store.entries[g.slug]?.h !== h;
    });

    console.log(`[guides:${locale}] ${stale.length}/${GUIDES.length} need translation`);
    if (DRY_RUN) continue;

    const jobs = stale.map((g) => async () => {
      const h = hashOf(
        g.title,
        g.description,
        ...g.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
        ...(g.faq ?? []).flatMap((f) => [f.question, f.answer])
      );
      const entry: GuideTranslation = {
        h,
        title: await translateText(g.title, locale),
        description: await translateText(g.description, locale),
        sections: [],
      };
      for (const section of g.sections) {
        entry.sections.push({
          heading: section.heading ? await translateText(section.heading, locale) : undefined,
          paragraphs: await Promise.all(section.paragraphs.map((p) => translateText(p, locale))),
        });
      }
      if (g.faq?.length) {
        entry.faq = [];
        for (const f of g.faq) {
          entry.faq.push({
            question: await translateText(f.question, locale),
            answer: await translateText(f.answer, locale),
          });
        }
      }
      store.entries[g.slug] = entry;
      saveStore(file, store);
      console.log(`  ✓ ${g.slug} (${locale})`);
    });

    await runPool(jobs);
    saveStore(file, store);
  }
}

/* ----------------------------------------------------------------- catalog */

async function fetchProducts() {
  const res = await fetch(CATALOG_ENDPOINT, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`);
  const parsed = Base44CatalogResponseSchema.safeParse(await res.json());
  if (!parsed.success) throw new Error("catalog response failed validation");
  // Drop the records the per-product schema could not read.
  return parsed.data.data.filter((product) => product !== null).map(normalizeProduct);
}

async function translateCatalog(): Promise<void> {
  const all = await fetchProducts();
  const products = IN_STOCK_ONLY ? all.filter((p) => p.availability === "in_stock") : all;
  console.log(
    `[catalog] fetched ${all.length} products` +
      (IN_STOCK_ONLY ? `, translating ${products.length} in stock` : "")
  );

  const categories = new Map<string, string>();
  for (const p of products) {
    if (p.categorySlug && p.category) categories.set(p.categorySlug, p.category);
  }

  for (const locale of LOCALE_ARG ? [LOCALE_ARG] : LOCALES) {
    const file = `catalog.${locale}.json`;
    const store = loadStore<CatalogStore>(file, { products: {}, categories: {} });

    const staleProducts = products.filter(
      (p) => store.products[p.modelNumber]?.h !== hashOf(p.name, p.description)
    );
    const staleCategories = [...categories].filter(
      ([slug, name]) => store.categories[slug]?.h !== hashOf(name)
    );

    console.log(
      `[catalog:${locale}] ${staleProducts.length}/${products.length} products, ` +
        `${staleCategories.length}/${categories.size} categories need translation`
    );
    if (DRY_RUN) continue;

    const batch = LIMIT ? staleProducts.slice(0, LIMIT) : staleProducts;
    if (LIMIT && staleProducts.length > batch.length) {
      console.log(`  (batch: ${batch.length} of ${staleProducts.length}; rerun for the rest)`);
    }

    let done = 0;
    let failed = 0;
    const jobs = batch.map((p) => async () => {
      // A single product must not discard the run. The free endpoint
      // rate-limits somewhere past a couple of thousand requests, and throwing
      // out of the pool used to lose everything since the last checkpoint —
      // which contradicts the resumability this script promises. A product that
      // fails is simply left unhashed, stays stale, and is retried on the next
      // run, so repeated runs converge instead of restarting.
      try {
        const name = await translateText(p.name, locale);
        const description = await translateText(p.description, locale);
        store.products[p.modelNumber] = { h: hashOf(p.name, p.description), name, description };
      } catch {
        failed++;
        return;
      }
      done++;
      if (done % 25 === 0) {
        saveStore(file, store);
        console.log(`  … ${done}/${batch.length} products (${locale})`);
      }
    });
    await runPool(jobs);
    if (failed > 0) {
      console.log(`  ! ${failed} products failed this run (${locale}) — rerun to pick them up`);
    }

    for (const [slug, name] of staleCategories) {
      try {
        store.categories[slug] = { h: hashOf(name), name: await translateText(name, locale) };
      } catch {
        console.log(`  ! category ${slug} failed (${locale})`);
      }
    }

    saveStore(file, store);
    console.log(`  ✓ catalog ${locale} store saved`);
  }
}

/* -------------------------------------------------------------------- main */

const started = Date.now();
console.log(`Translator: ${DEEPL_KEY ? `DeepL (${DEEPL_API.includes("api-free") ? "free" : "pro"} plan)` : "Google (free endpoint)"}`);
if (!ONLY_CATALOG) await translateGuides();
if (!ONLY_GUIDES) await translateCatalog();
console.log(
  `Done in ${Math.round((Date.now() - started) / 1000)}s, ${requestCount} API requests.` +
    (DEEPL_KEY ? ` DeepL characters billed: ${billedChars.toLocaleString("en")}.` : ""),
);
