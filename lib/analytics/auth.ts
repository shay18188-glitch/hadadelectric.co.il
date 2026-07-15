/**
 * Password gate for the /admin dashboard.
 *
 * The password lives only in the ADMIN_PASSWORD server env var (never
 * NEXT_PUBLIC). On login we hand out an HMAC-signed, expiring cookie so the
 * session can be verified without re-sending the password and cannot be
 * forged without knowing it.
 *
 * The token is signed with a key derived from BOTH the password and an
 * optional dedicated ADMIN_SESSION_SECRET, so (a) the password is never the
 * raw HMAC key, (b) rotating ADMIN_SESSION_SECRET instantly invalidates every
 * outstanding session, and (c) changing the password also logs everyone out.
 */

// `__Host-` prefix pins the cookie to Secure + Path=/ + no Domain (enforced by
// the browser), which is the strongest cookie scoping available.
export const ADMIN_COOKIE = "__Host-hda_admin";
const TOKEN_VERSION = "v1";
const SESSION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const encoder = new TextEncoder();

function getPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

/** HMAC signing key: bound to the password and an optional rotation secret. */
function getSigningKey(): string | null {
  const pw = getPassword();
  if (!pw) return null;
  const extra = process.env.ADMIN_SESSION_SECRET ?? "";
  return `${TOKEN_VERSION}:${pw}:${extra}`;
}

export function isAdminConfigured(): boolean {
  return getPassword() !== null;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function verifyPassword(candidate: string): boolean {
  const password = getPassword();
  if (!password) return false;
  return safeEqual(candidate, password);
}

/** Signed message for a given expiry — versioned + purpose-bound. */
function tokenMessage(exp: number): string {
  return `${TOKEN_VERSION}:session:${exp}`;
}

/** Create a signed session token valid for 7 days. */
export async function createToken(): Promise<string | null> {
  const key = getSigningKey();
  if (!key) return null;
  const exp = Date.now() + SESSION_MS;
  const sig = await hmacHex(key, tokenMessage(exp));
  return `${exp}.${sig}`;
}

/** Verify a session token: not expired and signature matches. */
export async function verifyToken(token: string | undefined): Promise<boolean> {
  const key = getSigningKey();
  if (!key || !token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmacHex(key, tokenMessage(exp));
  return safeEqual(sig, expected);
}

export const SESSION_MAX_AGE_SECONDS = Math.floor(SESSION_MS / 1000);
