/**
 * When a listing page is worth an index slot.
 *
 * The catalog auto-generates a page for every brand and every category the
 * supplier feed happens to contain. That produced 118 brand pages and 72
 * category pages, of which 33 brands and 7 categories hold a single product —
 * a page whose entire content is one tile that already has its own URL.
 *
 * Search Console bears this out: across 56 brand pages with 1,852 impressions
 * in 28 days, the section returned 6 clicks at a 0.32% click rate, and not one
 * of the small-inventory pages ranked. Meanwhile the site is asking Google to
 * crawl roughly 3,000 URLs on the authority of a single-location store.
 *
 * These pages stay live and stay linked — a visitor browsing by brand should
 * still find them, and they still pass link equity to the product. They come
 * out of the index and out of the sitemap, which is where they cost something
 * and return nothing.
 */
export const MIN_PRODUCTS_FOR_INDEX = 3;

export function shouldIndexListing(productCount: number): boolean {
  return productCount >= MIN_PRODUCTS_FOR_INDEX;
}
