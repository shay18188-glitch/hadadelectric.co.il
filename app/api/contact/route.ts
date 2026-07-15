import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hitRateLimit } from "@/lib/analytics/events";
import { recordLead } from "@/lib/analytics/leads";
import { clientIp, isSameOrigin } from "@/lib/http/security";

export const runtime = "nodejs";

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  email: z.string().email().max(150).optional().or(z.literal("")),
  message: z.string().min(2).max(2000),
  relevantProduct: z.string().max(200).optional().or(z.literal("")),
  privacyAccepted: z.boolean(),
  // Honeypot: a hidden field real users never see or fill. Accepted by the
  // schema but handled after parsing — a non-empty value gets a silent success.
  company: z.string().max(200).optional(),
});

const RATE_LIMIT = 5; // submissions per 10 minutes per IP

/**
 * MVP contact form handler.
 * TODO: connect to a real CRM / Base44 lead endpoint / email service once available.
 */
export async function POST(request: NextRequest) {
  // CSRF defense-in-depth: reject cross-site posts.
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: "bad_origin" }, { status: 403 });
  }

  // Abuse/spam throttle: max 5 submissions / 10 min / IP.
  if (await hitRateLimit("contact", clientIp(request), RATE_LIMIT, 600)) {
    return NextResponse.json(
      { success: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": "600" } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "invalid_input" }, { status: 400 });
  }

  // Honeypot tripped → looks like a bot. Pretend success, drop the submission.
  if (parsed.data.company) {
    return NextResponse.json({ success: true });
  }

  if (!parsed.data.privacyAccepted) {
    return NextResponse.json({ success: false, error: "privacy_not_accepted" }, { status: 400 });
  }

  // Persist the lead so it shows up in the /admin inquiries panel. Fails soft:
  // if the store is down the visitor still gets a success (we never lose their
  // goodwill over our storage), and the submission is at least logged.
  const { name, phone, email, message, relevantProduct } = parsed.data;
  await recordLead({ name, phone, email, message, product: relevantProduct });

  // Avoid logging full personal details in plaintext production logs.
  console.info("[contact] new lead stored", {
    hasEmail: Boolean(email),
    hasProduct: Boolean(relevantProduct),
  });

  return NextResponse.json({ success: true });
}
