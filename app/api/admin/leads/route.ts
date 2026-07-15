import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyToken } from "@/lib/analytics/auth";
import { setLeadStatus, deleteLead } from "@/lib/analytics/leads";
import { isSameOrigin } from "@/lib/http/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only endpoint to manage stored contact leads. Guarded by the same
// signed session cookie as the dashboard, plus a same-origin (CSRF) check.
async function requireAdmin(req: Request): Promise<NextResponse | null> {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 });
  }
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await verifyToken(token))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return null;
}

async function readBody(req: Request): Promise<{ id?: unknown; status?: unknown }> {
  return (await req.json().catch(() => ({}))) as { id?: unknown; status?: unknown };
}

/** Update a lead's status: { id, status: "new" | "handled" }. */
export async function PATCH(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id, status } = await readBody(req);
  if (typeof id !== "string" || (status !== "new" && status !== "handled")) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const ok = await setLeadStatus(id, status);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}

/** Delete a lead: { id }. */
export async function DELETE(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await readBody(req);
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const ok = await deleteLead(id);
  return NextResponse.json({ ok });
}
