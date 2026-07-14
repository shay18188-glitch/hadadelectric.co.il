import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { resolveLegacyCategorySlug } from "@/lib/slug/legacyRedirects";
import { detectBot, detectAiReferral, recordServerHit } from "@/lib/analytics/events";

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

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
  // Run on page routes for bot/referral tracking, but never on static assets,
  // Next internals or file requests (keeps overhead negligible).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w]+$).*)"],
};
