/**
 * QA rules, output shape, review payload and record assembly, shared by the
 * Batch API runner (qa.mts) and the local-agent runner (local.mts).
 */
import { normalizeUrl, numbersIn, numbersSupported } from "./lib.mjs";
import type { Draft, Submission } from "./research-core.mjs";
import { AGENT_SOURCE_KINDS, type ResearchRecord, type SpecGroupId } from "../../lib/research/schema";

const TODAY = new Date().toISOString().slice(0, 10);

export const SYSTEM = `You are the final quality reviewer for product data at Hadad Electric, an appliance store in Israel. A cheaper model researched one product and returned facts with verbatim quotes from pages it fetched. Code has already checked each quote: "ok" means the quote is on the fetched page and contains the value's numbers; anything else means the quote failed. Code also marked which pages name the exact model.

Your job, with no web access:
1. Identity. Decide whether the sources describe the exact catalog SKU (same model code and suffix, same capacity/size/door type as the catalog name, a variant sold in Israel or plausibly the same unit). matchConfidence: high = clearly the same SKU; medium = same model, Israeli suffix or variant unclear; low = sources describe a different or uncertain unit. Low publishes nothing.
2. Each fact: "keep" only if at least one of its quotes is "ok", on an exact-model page, and the quote actually says what the label and value claim (right attribute, right unit, not a different variant or a range misread). "conflict" if ok quotes disagree with each other. Otherwise "reject". You may fix the Hebrew label or wording of a value, but every number in the value must still be readable in an ok quote; do not compute or convert beyond metric unit shifts.
3. Source kinds: correct the kind of each source if the researcher mislabelled it (manufacturer, importer, manual, regulator, il-retailer, retailer, review, other).
4. Content, in Hebrew, for an Israeli buyer, built ONLY from facts you keep: summary (2-4 sentences: what it is, the 2-3 facts that matter most for this category, who it fits), highlights (3-5 short bullets, each one kept fact), goodFor (2-4 situations reasoned from kept facts), considerations (2-4 practical checks before buying grounded in kept facts: niche size, outlet, gas installer, wall bracket...), faq (3-5 real buyer questions answered from kept facts), metaDescription (120-155 characters: product type, brand, model, two strongest facts, ending "בחדד אלקטריק נהריה"), keywords (5-10 real search phrases). No superlatives, no claims not in kept facts, no prices, no stock. Use ״ in abbreviations and × between dimensions. Do not introduce any number (household size, room size, years, counts) that is not in a kept fact — code deletes any sentence that does. If too few facts survive, keep content short or empty rather than padding it.
5. reviewFlags: add anything a person must check (catalog name contradicts the manufacturer, discontinued, Israeli variant unclear, conflicts). Never propose a new product name.
6. verdict: pass (nothing to fix), pass-with-fixes (you rejected or corrected things — list them in notes), fail (identity wrong or almost nothing verifiable).`;

const s = (extra: object = {}) => ({ type: "string", ...extra });
const arr = (items: object) => ({ type: "array", items });
const obj = (properties: Record<string, object>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const decisionItem = obj({ id: { type: "integer" }, decision: s({ enum: ["keep", "reject", "conflict"] }), text: s(), note: s() });

export const QA_SCHEMA = obj({
  verdict: s({ enum: ["pass", "pass-with-fixes", "fail"] }),
  notes: s(),
  identity: obj({ matchConfidence: s({ enum: ["high", "medium", "low"] }), israeliImporter: { type: ["string", "null"] }, notes: s() }),
  sources: arr(obj({ url: s(), kind: s({ enum: [...AGENT_SOURCE_KINDS] }) })),
  facts: arr(obj({ id: { type: "integer" }, decision: s({ enum: ["keep", "reject", "conflict"] }), label: s(), value: s(), note: s() })),
  features: arr(decisionItem),
  inTheBox: arr(decisionItem),
  installation: arr(decisionItem),
  content: obj({
    summary: s(),
    highlights: arr(s()),
    goodFor: arr(s()),
    considerations: arr(s()),
    faq: arr(obj({ q: s(), a: s() })),
  }),
  seo: obj({ metaDescription: s(), keywords: arr(s()) }),
  reviewFlags: arr(obj({ field: s(), issue: s(), severity: s({ enum: ["high", "medium", "low"] }) })),
});

type Decision = { id: number; decision: "keep" | "reject" | "conflict"; text: string; note: string };
export interface QaOutput {
  verdict: "pass" | "pass-with-fixes" | "fail";
  notes: string;
  identity: { matchConfidence: "high" | "medium" | "low"; israeliImporter: string | null; notes: string };
  sources: { url: string; kind: string }[];
  facts: { id: number; decision: "keep" | "reject" | "conflict"; label: string; value: string; note: string }[];
  features: Decision[];
  inTheBox: Decision[];
  installation: Decision[];
  content: { summary: string; highlights: string[]; goodFor: string[]; considerations: string[]; faq: { q: string; a: string }[] };
  seo: { metaDescription: string; keywords: string[] };
  reviewFlags: { field: string; issue: string; severity: "high" | "medium" | "low" }[];
}

export function reviewPayload(d: Draft) {
  const sub = d.submission!;
  const pageNote = (url: string) => {
    const p = d.exactPages[normalizeUrl(url)];
    return p ? (p.catalogForm ? "names catalog model" : p.manufacturerForm ? "names manufacturer model form only" : "does NOT name the model") : "not fetched";
  };
  const withChecks = (items: { evidence: { url: string; quote: string }[] }[], checks: string[][]) =>
    items.map((item, id) => ({
      id,
      ...item,
      evidence: item.evidence.map((ev, j) => ({ ...ev, check: checks[id]?.[j], page: pageNote(ev.url) })),
    }));
  return {
    catalog: d.catalog,
    identity: sub.identity,
    sources: sub.sources.map((src) => ({ ...src, page: pageNote(src.url) })),
    facts: withChecks(sub.facts, d.checks.facts),
    features: withChecks(sub.features, d.checks.features),
    inTheBox: withChecks(sub.inTheBox, d.checks.inTheBox),
    installation: withChecks(sub.installation, d.checks.installation),
    catalogCheck: sub.catalogCheck,
    reviewFlags: sub.reviewFlags,
  };
}

const AUTHORITATIVE = new Set(["manufacturer", "importer", "manual", "regulator"]);

/**
 * Content whose numbers all appear in kept facts. Model codes are removed
 * first: "RD75SLK" is an identifier, not a claim of 75 of anything.
 */
function numbersGrounded(text: string, allowed: Set<number>, models: string[]): boolean {
  let plain = text;
  for (const model of models) {
    const pattern = model.trim().split(/[\s-]+/).filter(Boolean).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s-]*");
    if (pattern) plain = plain.replace(new RegExp(pattern, "gi"), " ");
  }
  return numbersIn(plain).every((n) => allowed.has(n));
}

export function assemble(d: Draft, qa: QaOutput): { record: ResearchRecord; dropped: string[] } {
  const sub = d.submission!;
  const dropped: string[] = [];
  const kindOf = new Map(qa.sources.map((x) => [normalizeUrl(x.url), x.kind]));
  const meta = new Map(sub.sources.map((x) => [normalizeUrl(x.url), x]));
  const ids = new Map<string, string>();
  const sources: ResearchRecord["sources"] = [];
  const sourceId = (url: string) => {
    const key = normalizeUrl(url);
    if (!ids.has(key)) {
      const id = `s${ids.size + 1}`;
      ids.set(key, id);
      const page = d.exactPages[key];
      const m = meta.get(key);
      let host = url;
      try {
        host = new URL(url).host;
      } catch {}
      sources.push({
        id,
        url,
        publisher: m?.publisher || host,
        kind: ((kindOf.get(key) ?? m?.kind ?? "other") as ResearchRecord["sources"][number]["kind"]),
        market: m?.market || "unknown",
        exactModel: Boolean(page && (page.catalogForm || page.manufacturerForm)),
        accessed: d.researchedAt,
      });
    }
    return ids.get(key)!;
  };

  /** Ok quotes on exact pages, and the confidence they earn. */
  const grade = (value: string, evs: { url: string; quote: string }[], checks: string[]) => {
    const good = evs.filter((ev, j) => {
      const page = d.exactPages[normalizeUrl(ev.url)];
      return checks[j] === "ok" && page && (page.catalogForm || page.manufacturerForm) && numbersSupported(value, ev.quote);
    });
    const kinds = good.map((ev) => kindOf.get(normalizeUrl(ev.url)) ?? meta.get(normalizeUrl(ev.url))?.kind ?? "other");
    const hosts = new Set(good.map((ev) => normalizeUrl(ev.url).split("/")[0]));
    // One Israeli retailer page is enough to publish (store owner, 2026-11-13).
    const confidence: "high" | "medium" | "low" = kinds.some((k) => AUTHORITATIVE.has(k))
      ? "high"
      : hosts.size >= 2 || kinds.includes("il-retailer")
        ? "medium"
        : "low";
    return { good, confidence };
  };

  const groups = new Map<SpecGroupId, ResearchRecord["specGroups"][number]["rows"]>();
  const allowedNumbers = new Set<number>();
  sub.facts.forEach((fact, i) => {
    const decision = qa.facts.find((x) => x.id === i);
    let value = decision?.value?.trim() || fact.value;
    let { good, confidence } = grade(value, fact.evidence, d.checks.facts[i] ?? []);
    if (decision && value !== fact.value && good.length === 0) {
      // The reviewer's rewording lost a number the quotes support; keep the researched value.
      dropped.push(`fact ${i} QA value "${value}" not supported by quotes; kept "${fact.value}"`);
      value = fact.value;
      ({ good, confidence } = grade(value, fact.evidence, d.checks.facts[i] ?? []));
    }
    const keep = decision?.decision === "keep" && good.length > 0;
    const status = decision?.decision === "conflict" ? "conflict" : keep ? "verified" : "unverified";
    const note = [
      decision?.note,
      !decision ? "QA did not review this fact" : "",
      good.length === 0 ? `quote checks: ${(d.checks.facts[i] ?? []).join(", ") || "none"}` : "",
    ]
      .filter(Boolean)
      .join("; ");
    const row = {
      label: decision?.label?.trim() || fact.label,
      value,
      sources: (good.length ? good : fact.evidence).map((ev) => sourceId(ev.url)),
      confidence: keep ? confidence : "low",
      status,
      ...(note ? { note } : {}),
    } as ResearchRecord["specGroups"][number]["rows"][number];
    if (keep && confidence !== "low") numbersIn(`${row.label} ${row.value}`).forEach((n) => allowedNumbers.add(n));
    const group = fact.group as SpecGroupId;
    groups.set(group, [...(groups.get(group) ?? []), row]);
  });

  const textFacts = (items: Submission["features"], checks: string[][], decisions: Decision[]) =>
    items.map((item, i) => {
      const decision = decisions.find((x) => x.id === i);
      const text = decision?.text?.trim() || item.text;
      const { good, confidence } = grade(text, item.evidence, checks[i] ?? []);
      const keep = decision?.decision === "keep" && good.length > 0;
      if (keep && confidence !== "low") numbersIn(text).forEach((n) => allowedNumbers.add(n));
      return {
        text,
        sources: (good.length ? good : item.evidence).map((ev) => sourceId(ev.url)),
        confidence: keep ? confidence : ("low" as const),
        status: decision?.decision === "conflict" ? ("conflict" as const) : keep ? ("verified" as const) : ("unverified" as const),
        ...(decision?.note ? { note: decision.note } : {}),
      };
    });

  const features = textFacts(sub.features, d.checks.features, qa.features);
  const inTheBox = textFacts(sub.inTheBox, d.checks.inTheBox, qa.inTheBox);
  const installation = textFacts(sub.installation, d.checks.installation, qa.installation);

  // Mechanical guard on the written content: no number that a kept fact does not carry.
  const models = [d.modelNumber.replace(/\s*\(\d+\)\s*$/, ""), sub.identity.exactModel];
  const guard = (items: string[], where: string) =>
    items.filter((text) => {
      const ok = numbersGrounded(text, allowedNumbers, models);
      if (!ok) dropped.push(`${where}: "${text}"`);
      return ok;
    });
  const summary = guard(qa.content.summary.split(/(?<=[.!?])\s+/), "summary").join(" ");
  const faq = qa.content.faq.filter((f) => {
    const ok = numbersGrounded(`${f.q} ${f.a}`, allowedNumbers, models);
    if (!ok) dropped.push(`faq: "${f.q}"`);
    return ok;
  });
  const meta155 = guard([qa.seo.metaDescription], "metaDescription")[0] ?? "";

  const record: ResearchRecord = {
    modelNumber: d.modelNumber,
    researchedAt: d.researchedAt,
    identity: {
      manufacturer: sub.identity.manufacturer,
      exactModel: sub.identity.exactModel,
      israeliImporter: qa.identity.israeliImporter ?? sub.identity.israeliImporter,
      matchConfidence: qa.identity.matchConfidence,
      notes: [sub.identity.notes, qa.identity.notes].filter(Boolean).join(" | QA: "),
    },
    sources: [],
    specGroups: [...groups.entries()].map(([id, rows]) => ({ id, rows })),
    features,
    inTheBox,
    installation,
    content: {
      summary,
      highlights: guard(qa.content.highlights, "highlight"),
      goodFor: guard(qa.content.goodFor, "goodFor"),
      considerations: guard(qa.content.considerations, "consideration"),
      faq: faq.map((f) => ({ ...f, sources: [] })),
    },
    seo: { metaDescription: meta155.slice(0, 170), keywords: qa.seo.keywords },
    catalogCheck: sub.catalogCheck.map((c) => ({
      field: c.field,
      catalogValue: c.catalogValue,
      finding: c.finding as ResearchRecord["catalogCheck"][number]["finding"],
      ...(c.correctValue ? { correctValue: c.correctValue } : {}),
      sources: c.url && d.exactPages[normalizeUrl(c.url)] ? [sourceId(c.url)] : [],
    })),
    reviewFlags: [...sub.reviewFlags, ...qa.reviewFlags].filter(
      (f, i, all) => all.findIndex((g) => g.field === f.field && g.issue === f.issue) === i
    ),
    qa: {
      reviewedAt: TODAY,
      verdict: qa.verdict,
      notes: `${qa.notes}${dropped.length ? ` | code guard removed: ${dropped.join("; ")}` : ""}`,
    },
  };
  record.sources = sources;
  return { record, dropped };
}

