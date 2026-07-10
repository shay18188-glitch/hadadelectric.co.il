import { NextResponse, type NextRequest } from "next/server";
import { resolveLegacyCategorySlug } from "@/lib/slug/legacyRedirects";

export function middleware(request: NextRequest) {
  const categoryMatch = request.nextUrl.pathname.match(/^\/categories\/([^/]+)$/);
  if (!categoryMatch) return NextResponse.next();

  const slug = decodeURIComponent(categoryMatch[1]);
  const canonical = resolveLegacyCategorySlug(slug);
  if (!canonical || canonical === slug) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/categories/${canonical}`;
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: ["/categories/:path*"],
};
