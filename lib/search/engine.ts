/**
 * Catalog search engine.
 *
 * Every product is indexed as tokens tagged with the field they came from
 * (name, model, brand, category, researched alias, spec text). A query token
 * then matches vocabulary tokens through progressively looser rules — exact,
 * Hebrew morphology (prefixes ו/ה/ב/ל/מ/ש/כ, plural endings), prefix while
 * typing, spelling skeleton (טלויזיה ≈ טלוויזיה), cross-script sound key
 * (נינגה ≈ ninja), typo distance, and the other keyboard layout — each with
 * a lower weight. A product must match every token the catalog knows; when
 * none does, the best partial matches are returned and flagged.
 *
 * Pure and synchronous: safe in route handlers and server components.
 */
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";
import type { Brand } from "@/types/brand";
import { normalizeHebrewSearch, SEARCH_STOP_WORDS } from "@/lib/search/normalizeHebrew";
import { productSearchBlob } from "@/lib/search/searchBlob";
import {
  brandAliases,
  categoryAliases,
  EXTRA_STOP_WORDS,
  productAliases,
  SEARCH_PHRASES,
  SEARCH_REWRITES,
} from "@/lib/search/aliases";
import {
  allowedTypos,
  compactModel,
  editDistance,
  hasDigit,
  hebrewSkeleton,
  hebrewStems,
  isHebrewToken,
  isLatinToken,
  soundKey,
  swapKeyboardLayout,
} from "@/lib/search/textMatch";

type Field = 0 | 1 | 2 | 3 | 4 | 5;
const F_NAME: Field = 0;
const F_MODEL: Field = 1;
const F_ALIAS: Field = 2;
const F_BRAND: Field = 3;
const F_CATEGORY: Field = 4;
const F_EXTRA: Field = 5;
const FIELD_WEIGHT = [1, 1, 0.95, 0.9, 0.88, 0.45];

export type MatchKind = "exact" | "stem" | "prefix" | "skeleton" | "sound" | "typo" | "model" | "layout";
/** Kinds that change what the shopper typed, worth a "showing results for". */
const CORRECTING_KINDS: ReadonlySet<MatchKind> = new Set(["skeleton", "sound", "typo", "layout"]);

interface Candidate {
  weight: number;
  kind: MatchKind;
}

interface TokenPlan {
  token: string;
  candidates: Map<string, Candidate>;
  required: boolean;
}

interface ScoredProduct {
  index: number;
  score: number;
  matched: number;
}

export interface SearchOutcome {
  query: string;
  normalizedQuery: string;
  /** Ranked products; full matches, or the best partial ones when none exist. */
  products: Product[];
  /** True when no product matched every recognised word. */
  partial: boolean;
  /** The query as understood, when typos/layout/transliteration were fixed. */
  correctedQuery: string | null;
  /** Categories the query names (by category name or alias), best first. */
  categorySlugs: string[];
  /** Brands the query names (by brand name or alias), best first. */
  brandSlugs: string[];
  /** Words the catalog does not know at all (dropped from matching). */
  unknownTokens: string[];
}

export interface SearchOptions {
  limit?: number;
  /** Only these model numbers may be returned (category/brand scoped pages). */
  allowed?: ReadonlySet<string>;
}

function tokensOf(text: string): string[] {
  return normalizeHebrewSearch(text).split(" ").filter(Boolean);
}

function isStopWord(token: string): boolean {
  return SEARCH_STOP_WORDS.has(token) || EXTRA_STOP_WORDS.has(token);
}

function addToSetMap(map: Map<string, Set<string>>, key: string, value: string) {
  let set = map.get(key);
  if (!set) map.set(key, (set = new Set()));
  set.add(value);
}

const FINAL_FORMS: Record<string, string> = { כ: "ך", מ: "ם", נ: "ן", פ: "ף", צ: "ץ" };
function displayToken(token: string): string {
  if (!isHebrewToken(token) || token.length < 2) return token;
  const last = token[token.length - 1];
  return FINAL_FORMS[last] ? token.slice(0, -1) + FINAL_FORMS[last] : token;
}

export class SearchEngine {
  readonly products: Product[];
  private postings = new Map<string, Map<number, { w: number; f: Field }>>();
  private vocabByLength = new Map<number, string[]>();
  private stemIndex = new Map<string, Set<string>>();
  private skeletonIndex = new Map<string, Set<string>>();
  private soundIndex = new Map<string, Set<string>>();
  private modelTokens = new Set<string>();
  private sortedVocab: string[] = [];
  private productText: string[] = [];
  private categoryKeyOf: string[] = [];
  /** Tokens that name each product's category (its name and full aliases). */
  private categoryTokens: Set<string>[] = [];
  /** Each product's category name, tokenized. */
  private categoryNameTokens: string[][] = [];
  private brandVocab = new Set<string>();
  /** Multi-word aliases: credited in full only when the whole phrase is typed. */
  private aliasPhrases = new Map<string, { field: Field; indices: Set<number> }>();

  constructor(products: Product[]) {
    this.products = products;
    products.forEach((product, index) => this.indexProduct(product, index));
    this.buildDerivedIndexes();
  }

  private add(token: string, index: number, field: Field, scale = 1) {
    if (!token) return;
    let list = this.postings.get(token);
    if (!list) this.postings.set(token, (list = new Map()));
    const weight = FIELD_WEIGHT[field] * scale;
    if (field === F_CATEGORY && scale === 1) (this.categoryTokens[index] ??= new Set()).add(token);
    if (field === F_BRAND) this.brandVocab.add(token);
    const existing = list.get(index);
    if (!existing || existing.w < weight) list.set(index, { w: weight, f: field });
  }

  private addPhrase(text: string, index: number, field: Field, isAlias: boolean) {
    const tokens = tokensOf(text);
    if (!isAlias || tokens.length === 1) {
      for (const token of tokens) this.add(token, index, field);
      return;
    }
    // A multi-word alias ("מקרר 2 דלתות", "טי סי אל") must not hand each of
    // its words to every product at full weight — "2" and "אל" would then
    // match the whole category or brand. Words count weakly on their own;
    // the full phrase is credited at query time (see score()).
    for (const token of tokens) {
      if (token.length >= 2 && !hasDigit(token)) this.add(token, index, field, 0.6);
    }
    const phrase = tokens.join(" ");
    let entry = this.aliasPhrases.get(phrase);
    if (!entry || FIELD_WEIGHT[entry.field] < FIELD_WEIGHT[field]) {
      const indices = entry?.indices ?? new Set<number>();
      this.aliasPhrases.set(phrase, (entry = { field, indices }));
    }
    entry.indices.add(index);
    // "אל גי", "gold line", "אייר פרייר" are also typed without the space.
    if (tokens.length <= 3) {
      const joined = tokens.join("");
      if (joined.length >= 4 && !hasDigit(joined)) this.add(joined, index, field);
    }
  }

  private indexProduct(product: Product, index: number) {
    this.addPhrase(product.name, index, F_NAME, false);

    for (const token of tokensOf(product.modelNumber)) this.add(token, index, F_MODEL);
    const compact = compactModel(product.modelNumber);
    if (compact.length >= 3) {
      this.add(compact, index, F_MODEL);
      this.modelTokens.add(compact);
    }

    if (product.brand) {
      this.addPhrase(product.brand, index, F_BRAND, true);
      for (const alias of brandAliases(product.brandSlug, product.brand)) this.addPhrase(alias, index, F_BRAND, true);
    }

    if (product.category) {
      this.addPhrase(product.category, index, F_CATEGORY, false);
      for (const alias of categoryAliases(product.category)) this.addPhrase(alias, index, F_CATEGORY, true);
    }

    for (const alias of productAliases(product.modelNumber)) {
      this.addPhrase(alias, index, F_ALIAS, true);
      const compactAlias = compactModel(alias);
      if (hasDigit(compactAlias) && compactAlias.length >= 4) this.modelTokens.add(compactAlias);
    }

    const blob = productSearchBlob(product);
    for (const token of blob.split(" ")) this.add(token, index, F_EXTRA);

    this.productText[index] = normalizeHebrewSearch(
      [product.name, ...productAliases(product.modelNumber)].join(" | ")
    );
    this.categoryKeyOf[index] = normalizeHebrewSearch(product.category ?? "");
    this.categoryNameTokens[index] = tokensOf(product.category ?? "");
    this.categoryTokens[index] ??= new Set();
  }

  private buildDerivedIndexes() {
    for (const token of this.postings.keys()) {
      const byLength = this.vocabByLength.get(token.length);
      if (byLength) byLength.push(token);
      else this.vocabByLength.set(token.length, [token]);

      addToSetMap(this.stemIndex, token, token);
      for (const stem of hebrewStems(token)) addToSetMap(this.stemIndex, stem, token);

      if (isHebrewToken(token) && token.length >= 4) {
        const skeleton = hebrewSkeleton(token);
        if (skeleton.length >= 3) addToSetMap(this.skeletonIndex, skeleton, token);
      }
      const key = soundKey(token);
      if (key.length >= 2 && token.length >= 3) addToSetMap(this.soundIndex, key, token);
    }
    this.sortedVocab = Array.from(this.postings.keys()).sort();
  }

  /** Vocabulary tokens a query token may stand for, with how sure we are. */
  private expand(token: string, isLast: boolean): Map<string, Candidate> {
    const out = new Map<string, Candidate>();
    const offer = (vocab: string, weight: number, kind: MatchKind) => {
      const existing = out.get(vocab);
      if (!existing || existing.weight < weight) out.set(vocab, { weight, kind });
    };

    if (this.postings.has(token)) offer(token, 1, "exact");

    const numeric = /^\d+(?:\.\d+)?$/.test(token);
    if (numeric) {
      // Sizes and capacities must match exactly; long digit runs may be part
      // of a model number ("6284" → EDH6284BM).
      if (token.length >= 4) {
        for (const model of this.modelTokens) if (model.includes(token)) offer(model, 0.8, "model");
      }
      return out;
    }

    if (hasDigit(token)) {
      const compact = compactModel(token);
      if (compact.length >= 3) {
        for (const model of this.modelTokens) {
          if (model.startsWith(compact)) offer(model, 0.97, "model");
          else if (compact.length >= 4 && model.includes(compact)) offer(model, 0.85, "model");
          else if (compact.length >= 6 && editDistance(compact, model.slice(0, compact.length), 1) <= 1) offer(model, 0.7, "typo");
        }
      }
      return out;
    }

    // Morphology: shared stem ("מקררים" ↔ "מקרר", "למקרר" ↔ "מקרר"). When
    // the word itself is in the catalog, chopping *it* down is a long shot
    // ("קרימי" is CREAMi, not "קרים").
    const knownAsTyped = this.postings.has(token);
    for (const vocab of this.stemIndex.get(token) ?? []) {
      if (vocab !== token) offer(vocab, 0.9, "stem");
    }
    for (const stem of hebrewStems(token)) {
      for (const vocab of this.stemIndex.get(stem) ?? []) {
        if (vocab !== token) offer(vocab, knownAsTyped ? 0.5 : 0.9, "stem");
      }
    }

    // Still typing: the last word is usually a prefix ("מקר" → מקרר).
    if (token.length >= 2 && (isLast || token.length >= 3)) {
      let lo = 0;
      let hi = this.sortedVocab.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (this.sortedVocab[mid] < token) lo = mid + 1;
        else hi = mid;
      }
      let taken = 0;
      for (let i = lo; i < this.sortedVocab.length && taken < 60; i++) {
        const vocab = this.sortedVocab[i];
        if (!vocab.startsWith(token)) break;
        if (vocab === token) continue;
        const ratio = token.length / vocab.length;
        // Mid-query prefixes are weaker: the shopper finished that word.
        offer(vocab, (isLast ? 0.62 : 0.5) + 0.3 * ratio, "prefix");
        taken++;
      }
    }

    if (isHebrewToken(token) && token.length >= 4) {
      const skeleton = hebrewSkeleton(token);
      // Three-letter skeletons are too common to trust on short words.
      if (skeleton.length >= 4 || (skeleton.length === 3 && token.length >= 6)) {
        for (const vocab of this.skeletonIndex.get(skeleton) ?? []) offer(vocab, 0.84, "skeleton");
      }
    }

    const key = soundKey(token);
    if (key.length >= 2 && token.length >= 3) {
      for (const vocab of this.soundIndex.get(key) ?? []) {
        if (vocab === token) continue;
        const crossScript = isHebrewToken(token) ? isLatinToken(vocab) : isLatinToken(token) && isHebrewToken(vocab);
        // Two-consonant keys are only trusted across scripts, on real words.
        // ("midea" ↔ "מידאה" yes; "where" ↔ "אוויר" no.)
        if (key.length === 2 && (!crossScript || token.length < 5 || vocab.length < 5 || !this.brandVocab.has(vocab))) continue;
        // Same-script sound keys are a looser skeleton: only on long keys.
        if (!crossScript && key.length < 4) continue;
        offer(vocab, crossScript ? 0.8 : 0.76, "sound");
      }
    }

    const typos = allowedTypos(token.length);
    if (typos > 0) {
      for (let length = token.length - typos; length <= token.length + typos; length++) {
        for (const vocab of this.vocabByLength.get(length) ?? []) {
          if (hasDigit(vocab) || (out.get(vocab)?.weight ?? 0) >= 0.78) continue;
          const distance = editDistance(token, vocab, typos);
          if (distance <= typos) offer(vocab, distance === 1 ? 0.78 : 0.6, "typo");
        }
      }
    }

    // A word the catalog knows as typed (or by its stem) means that word:
    // "קנווד" is Kenwood, not a typo of "קנדי"; "airfryer" is not "hairdryer".
    let hasSure = false;
    for (const candidate of out.values()) {
      if (candidate.kind === "exact" || candidate.kind === "stem" || candidate.kind === "model") {
        hasSure = true;
        break;
      }
    }
    if (hasSure) {
      const exactExists = out.get(token)?.kind === "exact";
      for (const [vocab, candidate] of out) {
        if (candidate.kind === "exact" || candidate.kind === "stem" || candidate.kind === "model") continue;
        if (candidate.kind === "prefix" && isLast && !exactExists) continue;
        out.delete(vocab);
      }
    }

    return out;
  }

  private plan(tokens: string[]): TokenPlan[] {
    // Single letters (a stray "ה" from "נינג ה", Russian "в", English "a")
    // carry no meaning on their own.
    const meaningful = tokens.filter((token) => !isStopWord(token) && (token.length > 1 || /\d/.test(token)));
    const used = meaningful.length > 0 ? meaningful : tokens;
    return used.map((token, i) => {
      const candidates = this.expand(token, i === used.length - 1);
      let best = 0;
      for (const candidate of candidates.values()) best = Math.max(best, candidate.weight);
      return { token, candidates, required: best >= 0.7 };
    });
  }

  /** Score every product against a plan. */
  private score(plans: TokenPlan[], allowed?: ReadonlySet<string>) {
    const n = plans.length;
    const best = new Map<number, Float32Array>();
    const fields = new Map<number, Uint8Array>();
    // Products whose own category is what a query word names.
    const categoryHit = new Set<number>();
    let namesCategoryOrBrand = false;
    const categoryFullDirect = new Set<number>();
    const ensureRows = (index: number) => {
      let row = best.get(index);
      let fieldRow = fields.get(index);
      if (!row || !fieldRow) {
        row = new Float32Array(n);
        fieldRow = new Uint8Array(n).fill(255);
        best.set(index, row);
        fields.set(index, fieldRow);
      }
      return { row, fieldRow };
    };

    plans.forEach((plan, i) => {
      for (const [vocab, candidate] of plan.candidates) {
        const list = this.postings.get(vocab);
        if (!list) continue;
        const fuzzy = candidate.kind === "typo" || candidate.kind === "sound" || candidate.kind === "skeleton";
        for (const [index, posting] of list) {
          if (allowed && !allowed.has(this.products[index].modelNumber)) continue;
          // A guessed correction must land on a word that defines the
          // product (name, brand, category, alias), not on spec-sheet text.
          if (fuzzy && posting.f === F_EXTRA) continue;
          const { row, fieldRow } = ensureRows(index);
          const value = candidate.weight * posting.w;
          if (value > row[i]) {
            row[i] = value;
            fieldRow[i] = posting.f;
          }
          if (candidate.weight >= 0.75 && this.categoryTokens[index]?.has(vocab)) {
            categoryHit.add(index);
            namesCategoryOrBrand = true;
            // An alias ("dishwasher", "פריזר") or a one-word category name
            // names the category outright; one word of a longer name
            // ("תנורי" of "תנורי חימום") is checked for coverage below.
            const nameTokens = this.categoryNameTokens[index];
            if (nameTokens.length === 1 || !nameTokens.includes(vocab)) categoryFullDirect.add(index);
          }
          if (posting.f === F_BRAND && candidate.weight >= 0.75) namesCategoryOrBrand = true;
        }
      }
    });

    // Whole multi-word aliases typed by the shopper ("מקרר 2 דלתות",
    // "אייר פרייר", "стиральные машины") credit each of their words at the
    // alias's full weight. Each typed word may match its phrase word by any
    // confident candidate (stem, typo, ...), not only letter for letter.
    const firstWords = new Set<string>();
    for (const plan of plans) {
      for (const [vocab, candidate] of plan.candidates) if (candidate.weight >= 0.75) firstWords.add(vocab);
    }
    for (const [phrase, entry] of this.aliasPhrases) {
      const words = phrase.split(" ");
      if (!firstWords.has(words[0]) || words.length > plans.length) continue;
      for (let start = 0; start + words.length <= plans.length; start++) {
        let certainty = 1;
        for (let k = 0; k < words.length && certainty > 0; k++) {
          const candidate = plans[start + k].candidates.get(words[k]);
          certainty = candidate && candidate.weight >= 0.75 ? Math.min(certainty, candidate.weight) : 0;
        }
        if (certainty === 0) continue;
        const weight = FIELD_WEIGHT[entry.field] * certainty;
        for (const index of entry.indices) {
          if (allowed && !allowed.has(this.products[index].modelNumber)) continue;
          const { row, fieldRow } = ensureRows(index);
          for (let k = 0; k < words.length; k++) {
            if (weight > row[start + k]) {
              row[start + k] = weight;
              fieldRow[start + k] = entry.field;
            }
          }
          if (entry.field === F_CATEGORY) {
            categoryHit.add(index);
            categoryFullDirect.add(index);
          }
        }
        if (entry.field === F_CATEGORY || entry.field === F_BRAND) namesCategoryOrBrand = true;
      }
    }

    // A category every one of whose words the query names ("תנור" names
    // "תנורים" fully but "תנורי חימום" only in part).
    const fullCategory = new Map<string, boolean>();
    const categoryFull = new Set<number>();
    for (const index of categoryHit) {
      if (categoryFullDirect.has(index)) {
        categoryFull.add(index);
        continue;
      }
      const key = this.categoryKeyOf[index];
      let full = fullCategory.get(key);
      if (full === undefined) {
        full = this.categoryNameTokens[index].every((word) =>
          plans.some((plan) => (plan.candidates.get(word)?.weight ?? 0) >= 0.75)
        );
        fullCategory.set(key, full);
      }
      if (full) categoryFull.add(index);
    }
    return { best, fields, categoryHit, categoryFull, namesCategoryOrBrand };
  }

  private rank(plans: TokenPlan[], allowed: ReadonlySet<string> | undefined, phraseText: string) {
    const { best, fields, categoryHit, categoryFull, namesCategoryOrBrand } = this.score(plans, allowed);
    const requiredIdx = plans.map((plan, i) => (plan.required ? i : -1)).filter((i) => i >= 0);
    const scored: ScoredProduct[] = [];

    for (const [index, row] of best) {
      let total = 0;
      let matchedRequired = 0;
      for (let i = 0; i < row.length; i++) {
        total += row[i];
        if (plans[i].required && row[i] >= 0.25) matchedRequired++;
      }
      if (total <= 0) continue;
      // The whole query, in order, inside the name or an alias.
      if (phraseText.includes(" ") && this.productText[index].includes(phraseText)) total += 0.6;
      // "מיקרוגל": a microwave outranks an oven that merely mentions one.
      if (categoryFull.has(index)) total += 0.2;
      else if (categoryHit.has(index)) total += 0.08;
      scored.push({ index, score: total, matched: matchedRequired });
    }

    const needed = requiredIdx.length;
    // A real word the catalog does not know ("אופניים") next to words that
    // match half the shop ("חשמליים"): the shop does not sell it, so showing
    // every electric product would only mislead.
    const df = plans.map((_, i) => {
      let count = 0;
      for (const row of best.values()) if (row[i] >= 0.25) count++;
      return count;
    });
    const unknownWords = plans.filter(
      (plan, i) => (!plan.required || df[i] === 0) && plan.token.length >= 3 && !/\d/.test(plan.token)
    );
    const matchedIdx = plans.map((_, i) => i).filter((i) => df[i] > 0);
    const scopeSize = allowed ? allowed.size : this.products.length;
    // ("מקרר חיפה" is fine: "מקרר" names a category, the city is noise.)
    if (
      unknownWords.length > 0 &&
      !namesCategoryOrBrand &&
      matchedIdx.length > 0 &&
      matchedIdx.every((i) => df[i] > scopeSize * 0.05)
    ) {
      return { pool: [] as ScoredProduct[], fields, partial: true };
    }
    let pool = needed > 0 ? scored.filter((entry) => entry.matched === needed) : scored;
    let partial = false;
    if (pool.length === 0 && scored.length > 0) {
      partial = true;
      const most = Math.max(...scored.map((entry) => entry.matched));
      pool = scored.filter((entry) => entry.matched === most && most > 0);
      if (pool.length === 0) pool = needed === 0 ? scored : [];
    }

    const products = this.products;
    pool.sort((a, b) =>
      b.score - a.score ||
      Number(products[b.index].availability === "in_stock") - Number(products[a.index].availability === "in_stock") ||
      Number(Boolean(products[b.index].imageUrl)) - Number(Boolean(products[a.index].imageUrl)) ||
      products[a.index].name.length - products[b.index].name.length
    );
    // Drop the long tail of incidental matches (a word only in spec text).
    const top = pool[0]?.score ?? 0;
    const cutoff = top * (plans.length > 1 ? 0.62 : 0.55);
    pool = pool.filter((entry) => entry.score >= cutoff);

    return { pool, fields, partial };
  }

  private run(rawQuery: string, tokens: string[], allowed?: ReadonlySet<string>, categoryKey?: string) {
    const plans = this.plan(tokens);
    const phraseText = plans.map((plan) => plan.token).join(" ");
    const scopedAllowed = categoryKey
      ? new Set(
          this.products
            .filter((product, index) => this.categoryKeyOf[index] === categoryKey && (!allowed || allowed.has(product.modelNumber)))
            .map((product) => product.modelNumber)
        )
      : allowed;
    const { pool, fields, partial } = this.rank(plans, scopedAllowed, phraseText);
    return { rawQuery, plans, pool, fields, partial };
  }

  private quality(result: ReturnType<SearchEngine["run"]>): number {
    if (result.pool.length === 0 || result.plans.length === 0) return 0;
    let known = 0;
    let certainty = 0;
    for (const plan of result.plans) {
      let best = 0;
      for (const candidate of plan.candidates.values()) best = Math.max(best, candidate.weight);
      if (plan.required) known++;
      certainty += best;
    }
    return (result.partial ? 1 : 2) + known / result.plans.length + certainty / result.plans.length;
  }

  /** Strongest candidate kind per token, for deciding whether to try repairs. */
  private allSure(result: ReturnType<SearchEngine["run"]>): boolean {
    return result.plans.every((plan) => {
      for (const candidate of plan.candidates.values()) {
        if (candidate.kind === "exact" || candidate.kind === "stem" || candidate.kind === "model") return true;
      }
      return false;
    });
  }

  search(query: string, options: SearchOptions = {}): SearchOutcome {
    const limit = options.limit ?? 60;
    const normalizedQuery = normalizeHebrewSearch(query);
    const baseTokens = normalizedQuery
      .split(" ")
      .filter(Boolean)
      .map((token) => SEARCH_REWRITES.get(token) ?? token)
      .flatMap((token) => token.split(" "));
    const empty: SearchOutcome = {
      query,
      normalizedQuery,
      products: [],
      partial: false,
      correctedQuery: null,
      categorySlugs: [],
      brandSlugs: [],
      unknownTokens: [],
    };
    if (baseTokens.length === 0) return empty;

    let chosen = this.run(query, baseTokens, options.allowed);
    let viaLayout = false;

    // A curated colloquial phrase ("פלאטה של שבת", "אייר פרייר") rewritten to
    // the catalog's own words, scoped to the category it belongs to.
    const joined = ` ${baseTokens.join(" ")} `;
    for (const phrase of SEARCH_PHRASES) {
      if (!joined.includes(` ${phrase.query} `)) continue;
      const rewritten = joined.replace(` ${phrase.query} `, ` ${phrase.means} `).trim().split(" ");
      const candidate = this.run(query, rewritten, options.allowed, phrase.category);
      if (candidate.pool.length > 0 && !candidate.partial) {
        chosen = candidate;
        break;
      }
    }

    // Typed on the wrong keyboard layout: "nerr" → "מקרר".
    if (!this.allSure(chosen) || chosen.pool.length === 0) {
      const swappedWords = query
        .trim()
        .split(/\s+/)
        .map((word) => swapKeyboardLayout(word) ?? word)
        .join(" ");
      if (swappedWords !== query.trim()) {
        const swappedTokens = normalizeHebrewSearch(swappedWords).split(" ").filter(Boolean);
        const swapped = this.run(query, swappedTokens, options.allowed);
        if (this.allSure(swapped) && this.quality(swapped) > this.quality(chosen) + 0.1) {
          chosen = swapped;
          viaLayout = true;
        }
      }
    }

    const { plans, pool, partial } = chosen;
    const products = pool.slice(0, limit).map((entry) => this.products[entry.index]);

    // Correction text: the vocabulary word that matched the best result.
    let corrected: string | null = null;
    const topEntry = pool[0];
    if (topEntry) {
      let changed = viaLayout;
      const words = plans.map((plan) => {
        let bestVocab = plan.token;
        let bestValue = 0;
        let bestKind: MatchKind = "exact";
        for (const [vocab, candidate] of plan.candidates) {
          const posting = this.postings.get(vocab)?.get(topEntry.index);
          if (!posting) continue;
          const value = candidate.weight * posting.w;
          if (value > bestValue) {
            bestValue = value;
            bestVocab = vocab;
            bestKind = candidate.kind;
          }
        }
        if (bestValue > 0 && CORRECTING_KINDS.has(bestKind) && bestVocab !== plan.token) {
          changed = true;
          return displayToken(bestVocab);
        }
        return plan.required ? displayToken(plan.token) : "";
      });
      if (changed) corrected = words.filter(Boolean).join(" ") || null;
    }

    // Category/brand intent: a query word matched through that field.
    const categoryScore = new Map<string, number>();
    const brandScore = new Map<string, number>();
    for (const entry of pool.slice(0, 120)) {
      const product = this.products[entry.index];
      let namesCategory = false;
      let namesBrand = false;
      for (const plan of plans) {
        for (const [vocab, candidate] of plan.candidates) {
          if (candidate.weight < 0.75) continue;
          const posting = this.postings.get(vocab)?.get(entry.index);
          if (!posting) continue;
          if (posting.f === F_CATEGORY) namesCategory = true;
          if (posting.f === F_BRAND && candidate.weight >= 0.78) namesBrand = true;
        }
      }
      if (namesCategory && product.categorySlug) {
        categoryScore.set(product.categorySlug, (categoryScore.get(product.categorySlug) ?? 0) + entry.score);
      }
      if (namesBrand && product.brandSlug) {
        brandScore.set(product.brandSlug, (brandScore.get(product.brandSlug) ?? 0) + entry.score);
      }
    }
    // A category word inside product names ("מקרר" in "מקרר 4 דלתות") also
    // names the category, as long as most results sit in it.
    if (categoryScore.size === 0 && pool.length > 0) {
      const counts = new Map<string, number>();
      const sample = pool.slice(0, 40);
      for (const entry of sample) {
        const slug = this.products[entry.index].categorySlug;
        if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
      for (const [slug, count] of counts) {
        if (count / sample.length >= 0.5 && brandScore.size === 0) categoryScore.set(slug, count);
      }
    }
    const byScore = (map: Map<string, number>) =>
      Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([slug]) => slug);

    return {
      query,
      normalizedQuery,
      products,
      partial,
      correctedQuery: corrected && corrected !== normalizedQuery ? corrected : null,
      categorySlugs: byScore(categoryScore),
      brandSlugs: byScore(brandScore),
      unknownTokens: plans.filter((plan) => !plan.required).map((plan) => plan.token),
    };
  }

  matchCategories(outcome: SearchOutcome, categories: Category[], limit = 4): Category[] {
    const bySlug = new Map(categories.map((category) => [category.slug, category]));
    return outcome.categorySlugs.map((slug) => bySlug.get(slug)).filter((c): c is Category => Boolean(c)).slice(0, limit);
  }

  matchBrands(outcome: SearchOutcome, brands: Brand[], limit = 4): Brand[] {
    const bySlug = new Map(brands.map((brand) => [brand.slug, brand]));
    return outcome.brandSlugs.map((slug) => bySlug.get(slug)).filter((b): b is Brand => Boolean(b)).slice(0, limit);
  }
}

const engines = new WeakMap<Product[], SearchEngine>();

/** One engine per catalog array; rebuilt only when the catalog changes. */
export function getSearchEngine(products: Product[]): SearchEngine {
  let engine = engines.get(products);
  if (!engine) {
    engine = new SearchEngine(products);
    engines.set(products, engine);
  }
  return engine;
}
