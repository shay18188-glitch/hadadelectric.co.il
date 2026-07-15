/**
 * Small server-side helpers shared by API route handlers: best-effort client
 * IP extraction and a same-origin (CSRF) check for state-changing requests.
 */

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * CSRF defense-in-depth (on top of the SameSite=Lax session cookie): reject a
 * state-changing request whose Origin header points at a different host than
 * the one serving it. A missing Origin (some same-origin navigations, non-
 * browser clients) is allowed so we don't break legitimate use; a present-but-
 * mismatched Origin is the cross-site-form-post signal we block.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
