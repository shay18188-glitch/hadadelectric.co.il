# Weekly site-search review

Every week an agent reviews what shoppers searched for on hadadelectric.co.il, finds the searches that failed them, and fixes them. This file is its runbook. A person can follow it the same way.

## How search works (read before changing anything)

- **Engine:** `lib/search/engine.ts`. It indexes each product's name, model, brand, category, researched aliases and spec text. It matches query words exactly, then by Hebrew stem (ה/ו/ב/ל/מ/ש/כ prefixes and plural endings), by prefix while the shopper types, by spelling skeleton (טלויזיה ≈ טלוויזיה), by Hebrew↔Latin sound (נינגה ≈ ninja), by typo distance, and on the other keyboard layout ("nerr" → מקרר). A product must match every word the catalog knows.
- **Names people use:** `content/search-aliases.json`. Fix searches here first, not in code:
  - `brands`: brand slug → spellings (Hebrew, Latin typos, Russian, Arabic).
  - `categories`: exact catalog category name → what people call it, in any language.
  - `products`: exact model number → series or marketing names ("Foodi", "Bespoke").
  - `phrases`: `{query, means, category}` rewrites a colloquial phrase to words found in that category's product names ("פלאטה של שבת" → "פלטת שבת").
  - `rewrites`: single word → replacement ("дюймов" → "אינץ").
  - `stopWords`: words that never need to match (cities, "מידות", "מחיר").
- **Regression cases:** `content/search-tests.json`, run with `npm run search:check`. Every fix adds a case.
- **Search log:** the site records each search's text, result count and outcome (`click`, `results_page`, `abandon`) in Redis. It stores no IP and no visitor id. The code is in `lib/analytics/searchLog.ts`, and the admin dashboard shows it under "חיפושים באתר".

## Steps

1. **Get this week's searches.** The production Redis URL lives in a git-ignored file, `.env.search-review` (`REDIS_URL=...`). If it is missing, the owner copies it once from Vercel → Storage → the Redis database → `.env.local` tab. Then run:

   ```bash
   npm run search:report -- --redis --days 7
   ```

   This writes `.search-review/report.md` and `.search-review/report.json`. Each distinct query appears with how often it was searched, how often it was abandoned, what results shoppers saw, and what the engine returns now. It carries these flags: `ZERO_NOW`, `WAS_ZERO`, `MOSTLY_ABANDONED`/`ABANDONED`, `ONLY_OUT_OF_STOCK`, `PARTIAL`, `UNKNOWN_WORDS`, `CORRECTED`.

   - If Redis is unreachable, use the Search Console queries instead. Export them in Chrome (Performance → Queries, last 28 days) to a TSV and run `npm run search:report -- --queries <file>`.
2. **Judge every flagged query, plus the 50 most frequent ones.** Mark each one:
   - **GOOD:** the top results are what the shopper wanted.
   - **BAD:** wrong or missing results, although the store sells a match.
   - **NOT_PRODUCT:** services, people, or other shops.
   - **NOT_SOLD:** the store doesn't sell it.
3. **Fix each BAD query in `content/search-aliases.json`.** Take product names, category names and slugs from `content/search-catalog.json`. Never add an alias that pulls unrelated products into a common query. Check any query with:

   ```bash
   npm run search:check -- "query"
   ```
4. **Add a case to `content/search-tests.json` for every fix.** Then run:

   ```bash
   npm run search:check
   ```

   It must report all cases passing.
5. **Leave NOT_SOLD queries searched 3+ times to the owner.** List them in the PR or commit message as demand signals: products to consider stocking, or catalog names that hide a product.
6. **Ship.**
   - **Data-only changes** (aliases, tests) that pass `npm run search:check`, `npx tsc --noEmit` and `npm run lint` are committed to `main` with the message "Weekly search review YYYY-MM-DD: …". A push to `main` deploys to production.
   - **Engine code changes** go on a branch named `search-review/YYYY-MM-DD`, with a pull request for the owner to review.
7. **Report.** Append a dated section to `docs/search/review-log.md`. Include the number of searches, the zero-result and abandon rates, what was fixed, the NOT_SOLD demand list, and anything the owner should change in Base44, such as wrong categories or typos in names.

## Guardrails

- Never edit `.env*` files, never print or commit `REDIS_URL`, never push secrets.
- Do not run `next build` repeatedly. Base44 rate-limits the whole app, and builds share the quota with production. One build per review, at most.
- Check free disk space first with `df -h /System/Volumes/Data`. Stop if under 3 GB.
