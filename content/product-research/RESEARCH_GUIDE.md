# Product research guide

How a product record in `records/` is researched, written and checked. The
schema is `lib/research/schema.ts`; the publication gate is
`scripts/compile-research.mts`. Read both before writing a record.

## Iron rules

1. **Nothing is invented.** Every spec row, feature, box item and installation
   note cites at least one source in `sources` that you actually opened in
   this session. Never fill a value from memory.
2. **Exact model only.** Never take a value from a sibling model, a different
   size in the same series, a regional variant with a different suffix, or a
   "similar" product. If the page you found is for `WW90T534DAW` and the store
   sells `WW90T534DAE`, the source is `exactModel: false` and cannot by itself
   verify anything. Note the variant difference in `identity.notes`.
3. **Conflict resolution.** Prefer, in order: the official Israeli importer for
   the exact model → the manufacturer for the exact model (Israeli/EU market
   first) → the manual / product fiche / EPREL → reputable Israeli retailers
   (two that agree) → reputable foreign retailers (two that agree). When two
   good sources disagree and neither is clearly authoritative, record the row
   with `status: "conflict"` and both values in `note`, and add a `reviewFlags`
   entry. Do not pick one.
4. **Unverified is kept, not published.** If you could only find a value on a
   single non-authoritative page, or the catalog states something you could not
   confirm, record it as `status: "unverified"` (or leave it to `catalogCheck`
   as `unverifiable`). The compiler withholds it and lists it for review.
5. **Never touch price, stock or availability.** They are not in the record.
6. **Hebrew output.** Labels, values, features and content are Hebrew, written
   for an Israeli buyer. Keep model numbers, technology names (Inverter, No
   Frost, Dolby Atmos, Wi-Fi 6) and units in their usual form. Use ״ (gershayim)
   in abbreviations: ס״מ, ק״ג, מק״ט. Use `×` between dimensions.

## Where to look (in this order)

1. Israeli importer / brand-Israel site (e.g. hye.co.il, electra, samsung.com/il,
   lg.com/il, bsh / bosch-home.co.il, delonghi Israel, Newpan, Tadiran,
   Electrolux Israel, Gorenje Israel, Normande/Topson importers).
2. Manufacturer global/EU site and spec PDFs; EPREL (eprel.ec.europa.eu) for
   EU energy-label data; user manuals (manualslib, the brand's support pages).
3. Israeli retailers that print full spec tables for the exact model (e.g.
   Machsanei Hashmal, Shekem Electric, Ace, KSP, Payngo, Zap model pages).
4. Foreign retailers / review labs only to corroborate.

Search with the exact model number in quotes, with and without the brand, and
in Hebrew and English. Open the pages (WebFetch); search snippets are not
sources.

## Record shape, field by field

- `modelNumber` — exactly the catalog `model_number`, trimmed (keep any
  importer suffix such as `(6363)`). File name: `researchFileName(modelNumber)`
  — non `[A-Za-z0-9._-]` runs become `_`, e.g. `X50B_Ultra.json`.
- `identity` — manufacturer, exact model as the manufacturer writes it,
  Israeli importer if found, `matchConfidence` (high = sources show this exact
  SKU; medium = exact model, Israeli suffix unclear; low = could not find the
  exact model → the record publishes nothing).
- `sources` — ids `s1`, `s2`… with url, publisher, kind, market, `exactModel`,
  accessed date.
- `specGroups` — use the fixed group ids from `SPEC_GROUPS`. Only groups that
  apply. Rows are short label/value pairs, one fact each.
  - `dimensions` **must** include, when known, a combined row
    `מידות (רוחב × גובה × עומק)` with value like `59.6 × 85 × 63.6 ס״מ`, plus
    separate rows when useful (`משקל`, `מידות כולל מעמד`, `מידות נישה להתקנה`,
    `עומק עם דלת פתוחה`). TVs: body without stand in the combined row and a
    separate `מידות כולל מעמד` row; `VESA` row like `300 × 300 מ״מ`.
  - `energy` — `דירוג אנרגטי` (state which scale: EU 2021 / Israeli label),
    `צריכת אנרגיה שנתית` in kWh, `הספק` in W, `מתח`, `סוג שקע` when the manual
    requires a dedicated 16A outlet, etc.
  - Category essentials to look for:
    - Fridges/freezers: total / fridge / freezer net volume, cooling system,
      compressor, climate class, noise dB, Shabbat mode, door reversibility.
    - Washers/dryers: capacity kg, max spin rpm, programs list, energy & water
      per cycle, noise wash/spin, dryer type (heat pump / condenser), steam.
    - Dishwashers: place settings, programs, temperatures, noise, half load,
      third rack, built-in type, niche dimensions.
    - Ovens/cooktops/hoods: volume, functions list, max temperature, cleaning
      system, burners/zones with power, gas type, cut-out dimensions, airflow
      m³/h for hoods.
    - TVs: panel type, resolution, refresh rate, HDR formats, processor, OS,
      HDMI count/version, eARC, audio W & channels, tuner, VESA, weight.
    - ACs: cooling/heating capacity BTU and kW, COP/EER, energy rating,
      refrigerant, noise indoor/outdoor, room size recommendation from the
      manufacturer, Wi-Fi.
    - Small appliances: power W, capacity, materials, programs, safety
      features, cable length, what is included.
  - `warranty` group: only what the importer states (period, who services).
    If the warranty is not stated for this exact model, do not write one.
- `features` — capabilities in plain Hebrew, one per item, each sourced.
- `inTheBox` — accessories included, from the manufacturer/importer/manual.
- `installation` — real requirements from the manual: niche/ventilation
  clearances, water/drain connection, dedicated outlet, gas connection by a
  licensed installer, wall mounting, levelling.
- `content` — written **only from facts you marked verified with high/medium
  confidence**. No superlatives that are not facts ("the best", "revolutionary").
  - `summary`: 2–4 sentences: what the product is, the 2–3 facts that matter
    most for this category, who it fits.
  - `highlights`: 3–5 short bullets, each a verified fact with its number.
  - `goodFor`: 2–4 customer situations it fits, reasoned from verified specs
    (e.g. "משפחה של 4–5 נפשות" only if capacity supports it; say why).
  - `considerations`: 2–4 practical things to check before buying (measure the
    niche, 16A outlet, gas installer, door swing, wall bracket not included…),
    each grounded in the record's own facts.
  - `faq`: 3–5 questions a buyer actually asks about this model, answered from
    the record's facts; `sources` lists the ids the answer relies on.
- `seo.metaDescription` — Hebrew, 120–155 characters: product type, brand,
  model, two strongest verified facts, ending with a short store hook such as
  "בחדד אלקטריק נהריה". `seo.keywords` — 5–10 real search phrases (Hebrew and
  model-number forms) for internal use.
- `catalogCheck` — one entry per fact in the catalog's current
  `technical_specifications` / `product_capabilities` / name:
  confirmed / corrected (with `correctValue`) / contradicted / unverifiable, plus
  `missing-added` for important facts the catalog lacked.
- `reviewFlags` — anything a person should look at: the catalog name is wrong
  (e.g. capacity in the title differs from the manufacturer), the product looks
  discontinued, the Israeli variant could not be confirmed, conflicts.
  **Do not change the product name** — names drive URLs; flag it instead.
  If the catalog's model code itself was not found on any source and you are
  relying on a close code (e.g. catalog `1301B`, sources `MS-1301BG`), add a
  `high` flag with field `model_number`. The compiler withholds any record with
  a high-severity identity flag until a person confirms the unit.
- Leave `qa` out. The QA reviewer adds it.

When done, validate: `npx tsx scripts/compile-research.mts --file <path>`.

## QA review (independent reviewer)

The reviewer did not write the record and assumes it is wrong until shown
otherwise:

1. Re-open every source URL. Drop or downgrade any source that does not load,
   or is not about the exact model (`exactModel: false`).
2. For every row marked verified, find the value on a cited page. If it is not
   there, set `status: "unverified"` and add a `note`. If the page says
   something else, fix the value only when the page is authoritative for the
   exact model; otherwise mark `conflict`.
3. Spot-check identity: same model suffix, same market, same capacity/size as
   the catalog name.
4. Read `content` and `seo` line by line: every claim must trace to a row that
   is still verified after step 2. Rewrite or delete claims that do not.
   Remove marketing superlatives. Check Hebrew quality and consistent units.
5. Set `qa: { reviewedAt, verdict, notes }` — `pass`, `pass-with-fixes`
   (you corrected things; list them), or `fail` (identity wrong, or most facts
   could not be confirmed). Validate with the compiler.
