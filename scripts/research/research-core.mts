/**
 * Research rules, record shapes and the code-side evidence check, shared by
 * the API runner (research.mts) and the local-agent runner (local.mts).
 */
import { z } from "zod";
import { checkEvidence, modelKeys, normalizeUrl, squash, type EvidenceStatus, type FetchedDoc, type researchInput } from "./lib.mjs";
import { SPEC_GROUPS, AGENT_SOURCE_KINDS } from "../../lib/research/schema";

export const TODAY = new Date().toISOString().slice(0, 10);

export const SYSTEM = `You research one home appliance for Hadad Electric, an appliance store in Nahariya, Israel. You find the manufacturer's facts for the EXACT model number and return them through the submit_research tool. Prices and stock are out of scope: never record them.

How to search (budget: about 6 searches and 8 fetches):
1. Search the exact model number in quotes, with and without the brand, in English and Hebrew. Prefer, in order: the official Israeli importer or the brand's Israeli site; the manufacturer's own product page or spec PDF; the user manual or EU product fiche (EPREL); Israeli retailers that print a full spec table for this exact model.
2. Fetch the pages you will quote. A search snippet is never evidence; only text from a page you fetched counts.
3. Stop when the important facts for the category are covered by an authoritative page, or the budget is spent.

Exact model only. A page about a sibling model (other size, other suffix, other colour code, other region variant) is not evidence for this model, even if most numbers look the same. If you can only find siblings, say so in identity.notes and reviewFlags, and submit few or no facts.

Evidence rules (they are checked by code, so follow them literally):
- Every fact, feature, box item and installation note carries 1-2 evidence items: the URL you fetched and a quote copied character-for-character from that page, 15-200 characters, containing the value.
- Every number in a value must appear in its quote. You may only convert metric units (mm→cm, g→kg). Do not round, do not convert inches, do not add numbers up.
- Write labels, values and texts in Hebrew for an Israeli buyer. Keep model names, technology names and units in their usual Latin form (Inverter, No Frost, Wi-Fi, W, kWh, dB). Use ״ in abbreviations (ס״מ, ק״ג) and × between dimensions.
- One fact per row. For dimensions, give a combined row "מידות (רוחב × גובה × עומק)" when the page gives all three, quoting the line that has them; add rows like "משקל", "מידות נישה להתקנה" separately.

Spec groups (use these ids): ${Object.entries(SPEC_GROUPS).map(([id, he]) => `${id}=${he}`).join(", ")}.

catalogCheck: for each fact in the store's current catalog text, say whether you confirmed it, corrected it (give the correct value and URL), found it contradicted, or could not verify it; add missing-added for important facts the catalog lacked.

reviewFlags: anything a person must check — the catalog name contradicts the manufacturer (capacity, size, door type), the model looks discontinued, the Israeli variant is unclear, sources conflict. If the catalog's model number itself appears on no page and you relied on a close code, add a high-severity flag with field "model_number".

Do not change or propose a new product name. When finished, call submit_research exactly once.`;

const evidence = {
  type: "array",
  items: {
    type: "object",
    properties: { url: { type: "string" }, quote: { type: "string" } },
    required: ["url", "quote"],
    additionalProperties: false,
  },
};
const textItems = {
  type: "array",
  items: {
    type: "object",
    properties: { text: { type: "string" }, evidence },
    required: ["text", "evidence"],
    additionalProperties: false,
  },
};

export const SUBMIT_TOOL = {
  name: "submit_research",
  description: "Submit the researched record for this product. Call once, at the end.",
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: {
      identity: {
        type: "object",
        properties: {
          manufacturer: { type: "string" },
          exactModel: { type: "string", description: "Model as the manufacturer writes it" },
          israeliImporter: { type: ["string", "null"] },
          notes: { type: "string" },
        },
        required: ["manufacturer", "exactModel", "israeliImporter", "notes"],
        additionalProperties: false,
      },
      sources: {
        type: "array",
        items: {
          type: "object",
          properties: {
            url: { type: "string" },
            publisher: { type: "string" },
            kind: { type: "string", enum: [...AGENT_SOURCE_KINDS] },
            market: { type: "string" },
          },
          required: ["url", "publisher", "kind", "market"],
          additionalProperties: false,
        },
      },
      facts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            group: { type: "string", enum: Object.keys(SPEC_GROUPS) },
            label: { type: "string" },
            value: { type: "string" },
            evidence,
          },
          required: ["group", "label", "value", "evidence"],
          additionalProperties: false,
        },
      },
      features: textItems,
      inTheBox: textItems,
      installation: textItems,
      catalogCheck: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string" },
            catalogValue: { type: "string" },
            finding: { type: "string", enum: ["confirmed", "corrected", "unverifiable", "contradicted", "missing-added"] },
            correctValue: { type: "string" },
            url: { type: "string" },
          },
          required: ["field", "catalogValue", "finding", "correctValue", "url"],
          additionalProperties: false,
        },
      },
      reviewFlags: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string" },
            issue: { type: "string" },
            severity: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["field", "issue", "severity"],
          additionalProperties: false,
        },
      },
    },
    required: ["identity", "sources", "facts", "features", "inTheBox", "installation", "catalogCheck", "reviewFlags"],
    additionalProperties: false,
  },
};

export type Ev = { url: string; quote: string };
export interface Submission {
  identity: { manufacturer: string; exactModel: string; israeliImporter: string | null; notes: string };
  sources: { url: string; publisher: string; kind: string; market: string }[];
  facts: { group: string; label: string; value: string; evidence: Ev[] }[];
  features: { text: string; evidence: Ev[] }[];
  inTheBox: { text: string; evidence: Ev[] }[];
  installation: { text: string; evidence: Ev[] }[];
  catalogCheck: { field: string; catalogValue: string; finding: string; correctValue: string; url: string }[];
  reviewFlags: { field: string; issue: string; severity: "high" | "medium" | "low" }[];
}

export interface Draft {
  modelNumber: string;
  researchedAt: string;
  catalog: ReturnType<typeof researchInput>;
  attempts: { model: string; costUsd: number; searches: number; fetches: number; requests: number; maxPrompt: number; error?: string }[];
  usedModel: string;
  submission: Submission | null;
  /** Normalized URL -> does the page name the exact model (catalog form or manufacturer form). */
  exactPages: Record<string, { catalogForm: boolean; manufacturerForm: boolean }>;
  /** Per evidence item, in submission order: facts, features, inTheBox, installation. */
  checks: { facts: EvidenceStatus[][]; features: EvidenceStatus[][]; inTheBox: EvidenceStatus[][]; installation: EvidenceStatus[][] };
  okFacts: number;
}

export function evaluate(sub: Submission, docs: Map<string, FetchedDoc>, catalogModel: string) {
  const exactPages: Draft["exactPages"] = {};
  const catalogKeys = modelKeys(catalogModel);
  const makerKeys = modelKeys("", sub.identity.exactModel);
  for (const [key, doc] of docs) {
    const page = squash(doc.text);
    exactPages[key] = {
      catalogForm: catalogKeys.some((k) => page.includes(k)),
      manufacturerForm: makerKeys.some((k) => page.includes(k)),
    };
  }
  const check = (value: string, evs: Ev[]) => evs.map((ev) => checkEvidence(value, ev, docs));
  const checks = {
    facts: sub.facts.map((f) => check(f.value, f.evidence)),
    features: sub.features.map((f) => check(f.text, f.evidence)),
    inTheBox: sub.inTheBox.map((f) => check(f.text, f.evidence)),
    installation: sub.installation.map((f) => check(f.text, f.evidence)),
  };
  const okFacts = sub.facts.filter((f, i) =>
    f.evidence.some((ev, j) => {
      const page = exactPages[normalizeUrl(ev.url)];
      return checks.facts[i][j] === "ok" && page && (page.catalogForm || page.manufacturerForm);
    })
  ).length;
  return { exactPages, checks, okFacts };
}


const EvSchema = z.object({ url: z.string().url(), quote: z.string().min(1) });
const TextItemSchema = z.object({ text: z.string().min(1), evidence: z.array(EvSchema).min(1).max(3) });

/** The same shape as SUBMIT_TOOL, for submissions written to a file by a local agent. */
export const SubmissionSchema = z.object({
  identity: z.object({
    manufacturer: z.string(),
    exactModel: z.string(),
    israeliImporter: z.string().nullable(),
    notes: z.string(),
  }),
  sources: z.array(z.object({ url: z.string().url(), publisher: z.string(), kind: z.enum(AGENT_SOURCE_KINDS), market: z.string() })),
  facts: z.array(
    z.object({
      group: z.enum(Object.keys(SPEC_GROUPS) as [string, ...string[]]),
      label: z.string().min(1),
      value: z.string().min(1),
      evidence: z.array(EvSchema).min(1).max(3),
    })
  ),
  features: z.array(TextItemSchema),
  inTheBox: z.array(TextItemSchema),
  installation: z.array(TextItemSchema),
  catalogCheck: z.array(
    z.object({
      field: z.string(),
      catalogValue: z.string(),
      finding: z.enum(["confirmed", "corrected", "unverifiable", "contradicted", "missing-added"]),
      correctValue: z.string(),
      url: z.string(),
    })
  ),
  reviewFlags: z.array(z.object({ field: z.string(), issue: z.string(), severity: z.enum(["high", "medium", "low"]) })),
});
