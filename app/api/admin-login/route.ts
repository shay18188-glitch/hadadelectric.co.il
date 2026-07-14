import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createToken, verifyPassword, SESSION_MAX_AGE_SECONDS, isAdminConfigured } from "@/lib/analytics/auth";

// Password check happens server-side against ADMIN_PASSWORD; on success we set
// an HMAC-signed, httpOnly session cookie. Runs on the Node runtime (default).
export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }

  const token = await createToken();
  if (!token) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}

/** Logout: clear the session cookie. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
