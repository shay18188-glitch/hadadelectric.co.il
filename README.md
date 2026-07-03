# חדד יובל אלקטריק בע״מ — Hadad Electric Website

Premium, Hebrew-first, SEO-focused public website and product catalog for **חדד יובל אלקטריק בע״מ** (Hadad Electric), an electrical appliances store in Nahariya, Israel.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**, deployed on **Vercel**, and powered by a public, read-only **Base44** catalog API (no prices, no exact stock quantities, no checkout/payments — WhatsApp/phone-based inquiries only).

## Tech stack

- Next.js (App Router, Server Components)
- TypeScript
- Tailwind CSS v4
- Fuse.js (fuzzy search)
- Zod (API response validation)
- Deployed on Vercel

## Getting started locally

```bash
npm install
cp .env.example .env.local   # then fill in values (see below)
npm run dev
```

The site runs at `http://localhost:3000`.

## Environment variables

See `.env.example`. All variables:

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public canonical site URL, no trailing slash (e.g. `https://hadadelectric.co.il`). Used for canonical tags, sitemap, JSON-LD, OG. |
| `NEXT_PUBLIC_BASE44_APP_ID` | Yes | The Base44 app id segment. Defaults to the confirmed live app id if unset. |
| `BASE44_APP_BASE_URL` | No | Overrides the computed Base44 base URL (`https://base44.app/api/apps/<APP_ID>`). Only set if Base44 gives you a different base URL. |
| `BASE44_API_TOKEN` | No | Reserved for future auth. The current public `getProductCatalog` endpoint requires no token. Never exposed to the client. |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics 4 measurement ID. Leave empty to disable analytics entirely. |
| `NEXT_PUBLIC_GTM_ID` | No | Google Tag Manager container ID. Leave empty to disable. |

Never commit real secrets — `.env.local` and other `.env*` files are gitignored.

## Connecting to Base44

The catalog is consumed exclusively through the public, read-only endpoint:

```
GET {BASE44_APP_BASE_URL}/functions/getProductCatalog?category=...&brand=...
```

All API access is centralized in [`lib/base44/catalog.ts`](lib/base44/catalog.ts). It:

- Only ever sends the two safe, sanitized query params (`category`, `brand`).
- Validates every response with Zod (`types/api.ts`) before it touches any page.
- Never requests, stores, logs, or renders price, cost, supplier data, exact stock quantity, or any other sensitive/internal field.
- Falls back to a small local mock catalog (`lib/base44/mockCatalog.ts`) if the live API is unreachable, so the site never shows a broken or empty catalog. This fallback is logged server-side and is never silently mixed with real data.
- Caches/revalidates the catalog fetch every 30 minutes (ISR) via Next's `fetch` cache (`tags: ["catalog"]`).

If Base44 ever exposes a webhook on catalog changes, wire it to a new authenticated route that calls `revalidateCatalog()` from [`lib/cache/revalidate.ts`](lib/cache/revalidate.ts) to bust the cache immediately instead of waiting for the 30-minute window.

## Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add the environment variables from `.env.example` in the Vercel project settings (Production + Preview).
4. Deploy — build command `npm run build`, output is handled automatically by the Next.js Vercel integration.

### Connecting the domain

1. In the Vercel project, go to **Settings → Domains** and add `hadadelectric.co.il` (and `www.hadadelectric.co.il` if desired, with a redirect to the apex or vice versa).
2. Update your DNS provider with the records Vercel provides (typically an `A`/`ALIAS` record for the apex domain and a `CNAME` for `www`).
3. Set `NEXT_PUBLIC_SITE_URL=https://hadadelectric.co.il` in the production environment variables once the domain is live.

### Image domains

Remote product images are served from Base44/S3. Allowed hosts are configured in [`next.config.ts`](next.config.ts) under `images.remotePatterns` (`*.amazonaws.com`, `base44.app`, `*.base44.app`). If Base44 starts serving images from a different host, add it there.

### Analytics (GA4 / GTM)

Set `NEXT_PUBLIC_GA_ID` and/or `NEXT_PUBLIC_GTM_ID` in your Vercel environment variables. Scripts load lazily (`afterInteractive`) via [`components/Analytics.tsx`](components/Analytics.tsx) and never block rendering. Tracked events are listed in [`lib/analytics.ts`](lib/analytics.ts) (WhatsApp/phone clicks, product views, add/remove-to-request, search, filters, contact form submits, category/brand views).

## Project structure

```
app/                  Routes (App Router) — pages, layouts, sitemap.ts, robots.ts
components/           Reusable UI components
lib/base44/           Base44 API client, types normalization, mock fallback
lib/seo/              Metadata builders
lib/schema/           JSON-LD builders (LocalBusiness, Product, Breadcrumb, FAQ, Article...)
lib/slug/             Slug generation for products/categories/brands
lib/search/           Hebrew search normalization + Fuse.js index
lib/whatsapp/         WhatsApp message builders
content/              Hand-written SEO content (FAQ, guides, local pages, category intros)
types/                Shared TypeScript types
public/brand/         Logo asset
```

## Business rules enforced throughout the codebase

- **No prices** anywhere in the UI, metadata, JSON-LD, or logs.
- **No exact stock quantities** — only the boolean `is_available` is ever used, rendered as one of three states: "במלאי" / "לא במלאי כרגע" / "צור קשר לבדיקת זמינות".
- **No checkout, no payments, no fake order numbers.** The "request basket" (`/request`) only builds a WhatsApp message; it is not a cart.
- **No fake claims** (cheapest, official importer, guaranteed stock, same-day delivery) anywhere in copy.
- Out-of-stock products still allow a WhatsApp inquiry.

## SEO checklist implemented

- Hebrew served at `/` (not `/he`), `lang="he-IL" dir="rtl"`.
- `/en` and `/ru` exist as intentionally minimal, `noindex` "coming soon" placeholders — ready to expand once real translations exist, without creating thin duplicate-content pages today.
- `app/sitemap.ts` includes all static, category, brand, product, guide, and local SEO pages.
- `app/robots.ts` disallows `/request` and `/api/*`; filtered `/products` query combinations are marked `noindex,follow` with canonical pointing to the clean catalog/category/brand URL.
- JSON-LD: Organization, LocalBusiness (ElectronicsStore), WebSite+SearchAction (sitewide in `app/layout.tsx`), Product, BreadcrumbList, FAQPage, Article (per-page as relevant) — never includes fake price/offers/reviews.
- Dynamic per-page metadata (title, description, canonical, OG/Twitter) for every product/category/brand/local/guide page via `lib/seo/metadata.ts`.
- Default OG image generated at `/opengraph-image` (edge, Hebrew-font-aware).

## Known TODOs / things to confirm before production launch

- [ ] Confirm exact business hours (`content/businessHours.ts` has placeholder hours marked for verification).
- [ ] Add real spam protection to the contact form (`app/api/contact/route.ts`) — e.g. hCaptcha/Turnstile or a honeypot field.
- [ ] Wire the contact form to a real CRM/email/Base44 lead endpoint (currently logs receipt only).
- [ ] Finalize legal copy in `/privacy-policy`, `/accessibility`, `/terms` with a lawyer — current copy is a placeholder framework.
- [ ] If/when Base44 exposes a catalog-change webhook, wire it to `/api/revalidate` (see `lib/cache/revalidate.ts`).
- [ ] Replace the generated placeholder OG image / expand localized OG images per page if desired.
- [ ] Build full `/en` and `/ru` translated experiences when content is ready (architecture is in place; see `components/LanguageSwitcher.tsx`).

## Scripts

```bash
npm run dev     # local dev server
npm run build   # production build
npm run start   # run the production build locally
npm run lint    # ESLint
```
