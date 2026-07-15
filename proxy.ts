import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { resolveLegacyCategorySlug } from "@/lib/slug/legacyRedirects";
import { detectBot, detectAiReferral, recordServerHit } from "@/lib/analytics/events";

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // Force canonical HTTPS with a 301. Vercel already upgrades http→https at the
  // edge (and HSTS is set), but enforce it here too so any stray http request
  // becomes a clean 301. Keyed off x-forwarded-proto; the localhost guard keeps
  // `next start`/dev (which reports http) working over plain http. On real https
  // traffic the header is "https", so this never fires and can't loop.
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") ?? "";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
  if (!isLocal && forwardedProto && forwardedProto.split(",")[0].trim() === "http") {
    const secure = request.nextUrl.clone();
    secure.protocol = "https:";
    secure.host = host || secure.host;
    return NextResponse.redirect(secure, 301);
  }

  // NOTE: malformed URLs that smuggle a full URL into the path (e.g.
  // /http://hadadelectric.co.il) are collapsed to the homepage by a router-level
  // redirect in next.config.ts — the middleware matcher can't receive a path
  // whose first segment contains a colon, so it's handled there instead.

  // Business analytics: count AI/search-bot crawls and AI-assistant referrals.
  // Pure string checks are cheap; the KV write runs in the background via
  // waitUntil so it never adds latency to the response. Skip the tracking
  // endpoint itself to avoid noise.
  if (pathname !== "/api/track") {
    const bot = detectBot(request.headers.get("user-agent") || "");
    const aiReferral = bot ? null : detectAiReferral(request.headers.get("referer") || "");
    if (bot || aiReferral) {
      event.waitUntil(recordServerHit({ bot, aiReferral }));
    }
  }

  // Legacy Hebrew category slug → canonical English slug (301).
  const categoryMatch = pathname.match(/^\/categories\/([^/]+)$/);
  if (categoryMatch) {
    const slug = decodeURIComponent(categoryMatch[1]);
    const canonical = resolveLegacyCategorySlug(slug);
    if (canonical && canonical !== slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/categories/${canonical}`;
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on page routes for bot/referral tracking and the https redirect, but
  // never on static assets, Next internals or file requests (keeps overhead
  // negligible).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w]+$).*)"],
};
