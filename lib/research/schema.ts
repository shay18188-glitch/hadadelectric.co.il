import { z } from "zod";

/**
 * The contract for researched product data.
 *
 * One JSON file per model lives in `content/product-research/records/`. Every
 * fact in it carries the sources it was read from, a confidence level and a
 * status, because the rule for this data is that nothing reaches a page as a
 * fact unless it was read on a source that names this exact model. The
 * records keep everything the researcher found — including what could not be
 * confirmed — and `scripts/compile-research.mts` is the single gate that
 * decides what is published (see `isPublishable`).
 *
 * Prices and stock are deliberately absent: they belong to the Base44 feed
 * and research never touches them.
 */

export const CONFIDENCE = ["high", "medium", "low"] as const;
export const STATUS = ["verified", "unverified", "conflict"] as const;

export const SOURCE_KINDS = [
  "manufacturer", // the brand's own site or spec sheet
  "importer", // the official Israeli importer / distributor
  "manual", // user manual, installation guide, product fiche
  "regulator", // EPREL, Israeli energy label registry, standards body
  "il-retailer", // a reputable Israeli retailer page for this exact model
  "retailer", // a reputable foreign retailer page for this exact model
  "review", // independent lab / review site
  "owner", // the store owner: packaging or rating-label photo, or a supplier page he confirmed is the unit he sells
  "other",
] as const;

/** Kinds a research or QA agent may assign. "owner" is added by a person only. */
export const AGENT_SOURCE_KINDS = SOURCE_KINDS.filter((k) => k !== "owner") as [
  Exclude<(typeof SOURCE_KINDS)[number], "owner">,
  ...Exclude<(typeof SOURCE_KINDS)[number], "owner">[],
];

export const SourceSchema = z.object({
  id: z.string().regex(/^s\d+$/),
  /** A fetched page, or `owner:<what>` for a photo or confirmation from the store owner. */
  url: z.union([z.string().url(), z.string().regex(/^owner:[a-z0-9-]+$/)]),
  publisher: z.string().min(1),
  kind: z.enum(SOURCE_KINDS),
  /** Market the page describes: "IL", "EU", "UK", "US", "global"... */
  market: z.string().min(2),
  /** True only when the page is about this exact model number. */
  exactModel: z.boolean(),
  accessed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const sourceRefs = z.array(z.string().regex(/^s\d+$/));

export const FactSchema = z.object({
  sources: sourceRefs,
  confidence: z.enum(CONFIDENCE),
  status: z.enum(STATUS),
  /** Why confidence is not high, or what conflicted. Internal, never rendered. */
  note: z.string().optional(),
});

export const SpecRowSchema = FactSchema.extend({
  label: z.string().min(1),
  value: z.string().min(1),
});

/**
 * Spec groups, in page order. A fixed list keeps every product page in the
 * same shape, so a reader comparing two models finds weight in the same
 * place on both.
 */
export const SPEC_GROUPS = {
  identity: "זיהוי הדגם",
  dimensions: "מידות ומשקל",
  capacity: "נפח וקיבולת",
  performance: "ביצועים",
  programs: "תוכניות ומצבי הפעלה",
  display: "מסך ותמונה",
  audio: "שמע",
  smart: "מערכת חכמה",
  connectivity: "חיבורים וקישוריות",
  energy: "אנרגיה וחשמל",
  noise: "רעש",
  design: "עיצוב וגימור",
  safety: "בטיחות",
  installation: "התקנה",
  warranty: "אחריות ושירות",
} as const;

export type SpecGroupId = keyof typeof SPEC_GROUPS;
const GROUP_IDS = Object.keys(SPEC_GROUPS) as [SpecGroupId, ...SpecGroupId[]];

export const SpecGroupSchema = z.object({
  id: z.enum(GROUP_IDS),
  rows: z.array(SpecRowSchema).min(1),
});

export const TextFactSchema = FactSchema.extend({ text: z.string().min(1) });

export const FaqSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
  /** Facts the answer relies on, as source ids. Empty means general guidance. */
  sources: sourceRefs,
});

export const CatalogCheckSchema = z.object({
  /** The feed field or spec label being checked. */
  field: z.string().min(1),
  catalogValue: z.string(),
  finding: z.enum(["confirmed", "corrected", "unverifiable", "contradicted", "missing-added"]),
  correctValue: z.string().optional(),
  sources: sourceRefs,
});

export const ReviewFlagSchema = z.object({
  field: z.string().min(1),
  issue: z.string().min(1),
  severity: z.enum(["high", "medium", "low"]),
});

export const ResearchRecordSchema = z.object({
  /** Exactly the Base44 `model_number`, trimmed. This is the join key. */
  modelNumber: z.string().min(1),
  researchedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  identity: z.object({
    manufacturer: z.string().min(1),
    /** The model as the manufacturer writes it. */
    exactModel: z.string().min(1),
    israeliImporter: z.string().nullable(),
    /** How sure the researcher is that the sources describe this exact SKU. */
    matchConfidence: z.enum(CONFIDENCE),
    notes: z.string().optional(),
  }),
  sources: z.array(SourceSchema),
  specGroups: z.array(SpecGroupSchema),
  features: z.array(TextFactSchema),
  inTheBox: z.array(TextFactSchema),
  installation: z.array(TextFactSchema),
  content: z.object({
    /** 2-4 Hebrew sentences built only from verified facts in this record. */
    summary: z.string(),
    highlights: z.array(z.string()),
    goodFor: z.array(z.string()),
    considerations: z.array(z.string()),
    faq: z.array(FaqSchema),
  }),
  seo: z.object({
    metaDescription: z.string().max(170),
    keywords: z.array(z.string()),
  }),
  catalogCheck: z.array(CatalogCheckSchema),
  reviewFlags: z.array(ReviewFlagSchema),
  qa: z
    .object({
      reviewedAt: z.string(),
      verdict: z.enum(["pass", "pass-with-fixes", "fail"]),
      notes: z.string(),
    })
    .optional(),
});

export type ResearchRecord = z.infer<typeof ResearchRecordSchema>;
export type ResearchFact = z.infer<typeof FactSchema>;

/**
 * The one publication rule.
 *
 * A fact is published when it is verified, rated high or medium, and backed
 * by at least one source that is about this exact model and is either the
 * manufacturer's / importer's / regulator's own material or a manual, or is
 * corroborated by a second exact-model source. Anything else stays in the
 * record for review and is never shown as fact.
 */
export function isPublishable(fact: ResearchFact, sources: Map<string, z.infer<typeof SourceSchema>>): boolean {
  if (fact.status !== "verified" || fact.confidence === "low") return false;
  const exact = fact.sources.map((id) => sources.get(id)).filter((s) => s && s.exactModel);
  if (exact.length === 0) return false;
  const authoritative = exact.some((s) => ["manufacturer", "importer", "manual", "regulator", "owner"].includes(s!.kind));
  return authoritative || exact.length >= 2;
}

/**
 * What the site actually renders: publishable facts only. Sources, notes and
 * confidence stay in the records for review and are not shown on the site.
 */
export interface PublishedResearch {
  modelNumber: string;
  researchedAt: string;
  manufacturer: string;
  israeliImporter: string | null;
  specGroups: { id: SpecGroupId; title: string; rows: { label: string; value: string }[] }[];
  features: string[];
  inTheBox: string[];
  installation: string[];
  summary: string;
  highlights: string[];
  goodFor: string[];
  considerations: string[];
  faq: { q: string; a: string }[];
  metaDescription: string;
}

/** File name for a model number: model numbers carry spaces, slashes, parentheses. */
export function researchFileName(modelNumber: string): string {
  return `${modelNumber.trim().replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "")}.json`;
}
