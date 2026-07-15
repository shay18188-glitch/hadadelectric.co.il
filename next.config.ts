import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy. Kept static (no per-request nonce) so all marketing
// pages stay statically generated / CDN-cached — nonces would force every page
// dynamic. Because the app renders framework + a few first-party inline scripts
// (a11y bootstrap, JSON-LD, GA/GTM init) that aren't stably hashable across
// builds, script-src keeps 'unsafe-inline'; everything else is locked down.
// Allowed third parties: Google Tag Manager / Analytics, Vercel Analytics, the
// Google Maps embed on the contact page, and product images from arbitrary
// supplier CDNs (img-src https:). 'unsafe-eval' is only added in dev (React
// refresh / error overlay).
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ""}https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://vitals.vercel-insights.com https://va.vercel-scripts.com`,
  `frame-src 'self' https://www.google.com https://www.googletagmanager.com`,
  `manifest-src 'self'`,
  `upgrade-insecure-requests`,
].join("; ");

// Applied to every response. Clickjacking, MIME-sniffing, HTTPS pinning,
// referrer scope and a tight feature-policy in one place.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    // Product images in the Base44 catalog come from many different
    // supplier/CDN hosts (not a fixed set), so we allow any HTTPS host
    // rather than trying to maintain an exhaustive allowlist. If you
    // want to lock this down later, replace with specific hostnames
    // once the real set of image hosts stabilizes.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  // Never expose the framework version banner.
  poweredByHeader: false,
  async redirects() {
    return [
      // Malformed indexed URLs that smuggle a whole URL into the path, e.g.
      // /http://hadadelectric.co.il or /https://hadadelectric.co.il (and the
      // slash-collapsed /http:/… form). The middleware matcher can't receive
      // colon-in-path URLs, so we collapse them to the homepage here at the
      // router layer. `permanent` emits a 308 (Google treats it exactly like a
      // 301 for consolidation — it's also what Next already returns when it
      // normalizes the doubled slash in these URLs).
      { source: "/:scheme(https?:.*)/:rest*", destination: "/", permanent: true },
      { source: "/:scheme(https?:.*)", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Admin dashboard and its auth/analytics APIs must never be cached by
      // shared caches or indexed, and must not leak referrers off-site.
      ...["/admin", "/admin/:path*", "/api/admin-login", "/api/admin/:path*", "/api/track"].map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      })),
    ];
  },
};

export default nextConfig;
