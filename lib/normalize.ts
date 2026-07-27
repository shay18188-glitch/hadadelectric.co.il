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

function toAvailability(isAvailable: boolean | null | undefined): AvailabilityState {
  if (isAvailable === true) return "in_stock";
  if (isAvailable === false) return "out_of_stock";
  return "unknown";
}

function buildDescription(product: Base44Product, cleanedName: string): string {
  const parts: string[] = [];
  if (product.product_capabilities) parts.push(product.product_capabilities);
  if (parts.length === 0) {
    return `לפרטים נוספים על ${cleanedName} וזמינות המוצר, ניתן לפנות לחדד יובל אלקטריק בע״מ בוואטסאפ או בטלפון.`;
  }
  return parts.join(" ");
}

export function normalizeProduct(product: Base44Product): Product {
  const brand = product.brand?.trim() || null;
  const category = product.category?.trim() || null;
  const modelNumber = product.model_number.trim();
  const correction = PRODUCT_CORRECTIONS[modelNumber.toUpperCase()];
  const name = correction?.name ?? cleanProductName(product.name, category);
  const specs = mergeSpecs(parseSpecs(product.technical_specifications), correction?.specs);
  const capabilities = mergeCapabilities(parseCapabilities(product.product_capabilities), correction?.capabilities);

  return {
    modelNumber,
    name,
    brand,
    brandSlug: brand ? generateBrandSlug(brand) : null,
    category,
    categorySlug: category ? generateCategorySlug(category) : null,
    imageUrl: normalizeImageUrl(product.image_url),
    originCountry: product.origin_country?.trim() || null,
    specs,
    capabilities,
    description: correction?.description ?? buildDescription(product, name),
    availability: toAvailability(product.is_available),
    slug: generateProductSlug(name, modelNumber),
  };
}
