import type { Base44Product } from "@/types/api";
import type { AvailabilityState, Product, SpecEntry } from "@/types/product";
import { generateBrandSlug, generateCategorySlug, generateProductSlug } from "@/lib/slug/slugify";

interface ProductCorrection {
  name?: string;
  specs?: SpecEntry[];
  capabilities?: string[];
  description?: string;
}

/**
 * Verified corrections for supplier records that are incomplete. The RT102
 * family data below was checked against H.Y. Group's official product sheet:
 * https://www.hye.co.il/mwdownloads/download/link/id/825/
 */
const PRODUCT_CORRECTIONS: Record<string, ProductCorrection> = {
  RT102SKI: {
    name: "מקרר 3 דלתות עם מקפיא תחתון 752 ליטר, נירוסטה",
    description:
      "מקרר Hisense רחב בנפח 752 ליטר עם תא קירור של 528 ליטר, מקפיא תחתון, קירור Total No Frost, מדחס אינוורטר, בר מים פנימי ויצרן קרח אוטומטי. מתאים למשפחות שמחפשות נפח אחסון גדול וחלוקה נוחה.",
    specs: [
      { label: "נפח כללי נטו", value: "752 ליטר" },
      { label: "נפח תא קירור", value: "528 ליטר" },
      { label: "נפח תא הקפאה", value: "224 ליטר" },
      { label: "מידות", value: "גובה 178 ס״מ, רוחב 91.1 ס״מ, עומק 85.5 ס״מ" },
      { label: "דירוג אנרגטי", value: "E לפי התקינה החדשה" },
      { label: "שיטת קירור", value: "Total No Frost" },
      { label: "מדחס", value: "Inverter" },
      { label: "גימור", value: "נירוסטה" },
      {
        label: "אחריות",
        value: "אחריות היבואן הרשמי H.Y. Group; משך ותנאים סופיים יאומתו מול החנות במעמד ההזמנה",
      },
    ],
    capabilities: [
      "יצרן קרח אוטומטי בחיבור ישיר לרשת המים",
      "בר מים פנימי בחיבור ישיר לרשת המים",
      "מערכת Multi Air Flow לפיזור אחיד של הקור",
      "מצב שבת וחג מובנה עד 80 שעות",
      "מדפי זכוכית מודולריים, מגירת צינון ומגירות לפירות וירקות",
      "תאורת LED בתא הקירור ובתא ההקפאה",
    ],
  },
};

/**
 * Splits a free-text specifications string (e.g. "נפח: 72 ליטר; דירוג: A")
 * into label/value pairs. Falls back to a single unlabeled entry when the
 * text doesn't follow a "label: value" pattern.
 */
function parseSpecs(raw: string | null | undefined): SpecEntry[] {
  if (!raw) return [];
  const chunks = raw
    .split(/[;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return chunks.map((chunk) => {
    const separatorMatch = chunk.match(/^(.+?):\s*(.+)$/);
    if (separatorMatch) {
      return { label: separatorMatch[1].trim(), value: separatorMatch[2].trim() };
    }
    return { label: "", value: chunk };
  });
}

function parseCapabilities(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * The manufacturer's model number, without the importer's internal code:
 * "HD-351RWEN (6363)" -> "HD-351RWEN".
 *
 * Applied at display and identifier time only, never to `product.modelNumber`
 * itself — the product slug is derived from the raw value, so normalizing it
 * upstream would move 66 live URLs.
 */
export function cleanModelNumber(modelNumber: string): string {
  return modelNumber.replace(/\s*\(\d+\)\s*$/, "").trim();
}

function cleanProductName(rawName: string, category: string | null): string {
  let name = rawName
    .replace(/\s*\((?:קלינטון|מחיר\s*תצוגה)\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // A supplier import inserted the room name "אמבטיה" into two 752L fridge
  // titles. Do not remove the word from genuine bathroom-heater products.
  if (category === "מקררים" && /752\s*ליטר/.test(name)) {
    name = name.replace(/\s+אמבטיה(?=\s+752\s*ליטר)/, "");
  }

  return name.replace(/\s+([,.:])/g, "$1").trim();
}

function mergeSpecs(catalogSpecs: SpecEntry[], verifiedSpecs: SpecEntry[] = []): SpecEntry[] {
  const merged = new Map<string, SpecEntry>();
  for (const spec of catalogSpecs) {
    const key = spec.label.trim().toLocaleLowerCase("he") || `value:${spec.value}`;
    merged.set(key, spec);
  }
  // Verified fields intentionally replace conflicting supplier fields.
  for (const spec of verifiedSpecs) {
    const key = spec.label.trim().toLocaleLowerCase("he") || `value:${spec.value}`;
    merged.set(key, spec);
  }
  return Array.from(merged.values());
}

function mergeCapabilities(catalog: string[], verified: string[] = []): string[] {
  return Array.from(new Set([...verified, ...catalog]));
}

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Supplier placeholder services frequently respond with SVG even when the
  // URL looks like a raster image. Treat them as missing so ProductImage can
  // use the site's safe local fallback without Next/Image runtime errors.
  if (/\b(?:placehold\.co|placeholder\.com)\b/i.test(url)) return null;
  return url;
}

/**
 * The product's images, lead shot first and without repeats.
 *
 * The feed says the same thing three ways: `primary_image`, the legacy
 * `image_url`, and a `gallery_images` row flagged `is_primary` — on live data
 * all three are the identical URL, so a naive concatenation would render a
 * two-image product as a gallery of four with the first three the same shot.
 * Candidates are therefore collected in priority order and deduped, which
 * also means a product whose only images arrive through the gallery array
 * still gets a lead shot.
 */
function buildImageSet(product: Base44Product): string[] {
  const gallery = (product.gallery_images ?? [])
    .filter((image): image is NonNullable<typeof image> => image != null)
    // `position` is the feed's own ordering; entries missing it keep their
    // array order rather than jumping to the front of the strip.
    .map((image, index) => ({ ...image, position: image.position ?? index }))
    .sort((a, b) => a.position - b.position);

  const candidates = [product.primary_image, product.image_url, ...gallery.map((image) => image.url)];

  const seen = new Set<string>();
  const images: string[] = [];
  for (const candidate of candidates) {
    const url = normalizeImageUrl(candidate);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    images.push(url);
  }
  return images;
}

function toAvailability(isAvailable: boolean | null | undefined): AvailabilityState {
  if (isAvailable === true) return "in_stock";
  if (isAvailable === false) return "out_of_stock";
  return "unknown";
}

/**
 * The product paragraph shown on the page — and, through the translation job,
 * on the English and Russian pages too.
 *
 * It used to be `product_capabilities` pasted verbatim: a semicolon-joined
 * run-on of every marketing bullet, which then appeared a second time in the
 * "יכולות ומאפיינים" list further down the same page. Two costs came out of
 * that. On the page it was duplicate content; in the SERP it was truncated
 * mid-word into a snippet that named neither the brand nor the model.
 *
 * The replacement opens with the facts that identify the product — brand,
 * model, category, then the specs that carry numbers — because that opening
 * sentence is what an answer engine quotes and what a searcher scanning for
 * their own model needs to see first. Marketing bullets keep their own
 * section; they are not repeated here.
 */
function buildDescription(product: Base44Product, cleanedName: string, specs: SpecEntry[]): string {
  const brand = product.brand?.trim();
  const category = product.category?.trim();
  const model = product.model_number.trim();

  const identity = [
    cleanedName,
    brand ? `מבית ${brand}` : "",
    model ? `דגם ${model}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  // Only specs with a number say something a reader cannot already see in the
  // product name. "גימור: נירוסטה" is in the title; "נפח: 470 ליטר" is not.
  // The model number is excluded even though it contains digits — it is
  // already in the opening sentence, and it was consuming a spec slot on 151
  // products to repeat itself.
  const identifierLabel = /^(דגם|מק"?ט|מק״ט|model|sku)\b/i;
  const numericSpecs = specs
    .filter((spec) => spec.label && /\d/.test(spec.value) && !identifierLabel.test(spec.label.trim()))
    .slice(0, 4)
    .map((spec) => `${spec.label}: ${spec.value}`);

  // Deliberately no "this model belongs to category X" sentence. It was
  // byte-identical filler on every page in the catalog and told a reader
  // nothing the breadcrumb above it did not already say.
  const sentences = [`${identity}${category ? `, מקטגוריית ${category}` : ""}.`];
  if (numericSpecs.length > 0) sentences.push(`נתוני מפרט עיקריים — ${numericSpecs.join("; ")}.`);
  sentences.push(
    product.is_available === false
      ? `הדגם אינו מסומן במלאי כרגע. צוות חדד יובל אלקטריק בנהריה יבדוק מועד אספקה או יציע חלופה מתאימה${category ? ` מתוך ${category} שבקטלוג` : ""}, עם משלוח והתקנה בכל אזור הצפון.`
      : `לבדיקת זמינות מדויקת של ${cleanedName} ולהצעת מחיר אישית — צוות החנות בנהריה, עם משלוח והתקנה עד בית הלקוח בכל אזור הצפון.`
  );

  return sentences.join(" ");
}

export function normalizeProduct(product: Base44Product): Product {
  const brand = product.brand?.trim() || null;
  const category = product.category?.trim() || null;
  const modelNumber = product.model_number.trim();
  const correction = PRODUCT_CORRECTIONS[modelNumber.toUpperCase()];
  const name = correction?.name ?? cleanProductName(product.name, category);
  const specs = mergeSpecs(parseSpecs(product.technical_specifications), correction?.specs);
  const capabilities = mergeCapabilities(parseCapabilities(product.product_capabilities), correction?.capabilities);

  const images = buildImageSet(product);

  return {
    modelNumber,
    name,
    brand,
    brandSlug: brand ? generateBrandSlug(brand) : null,
    category,
    categorySlug: category ? generateCategorySlug(category) : null,
    imageUrl: images[0] ?? null,
    images,
    originCountry: product.origin_country?.trim() || null,
    specs,
    capabilities,
    description: correction?.description ?? buildDescription(product, name, specs),
    availability: toAvailability(product.is_available),
    slug: generateProductSlug(name, modelNumber),
    expertNote: product.expert_content?.trim() || null,
  };
}
