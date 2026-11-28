# Search review log

One section per weekly review (see WEEKLY_SEARCH_REVIEW.md).

## 2026-11-28 — baseline (search overhaul)

No on-site search log existed before this date; logging starts with this release. The baseline used 979 Google Search Console queries (last 28 days) run through the old Fuse.js search and the new engine.

- Zero results: 135 queries before, 23 after. The remaining 23 are not product searches: the owner's name, other shops, electricity-cost calculations, Thai and Portuguese text.
- Judged by an audit agent: GOOD 731 → 836, BAD 109 → 4 (by Google impressions, BAD 3,949 → 187).
- Added: researched aliases for every brand, category and in-stock model (`content/search-aliases.json`) and 252 regression cases (`content/search-tests.json`).
- Known limits: long natural-language questions lose phrase rewrites in partial mode; numbers in a query must always match ("מזגן 1.25"); a keyboard-layout swap is not tried when part of the query is already a real word ("65 inch qwerty").
- For the owner to fix in Base44: see `catalog-notes-from-alias-research.md` (misspelled brands such as "Hemilton Beach", miscategorized products, typos in names).
