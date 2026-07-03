import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  email: z.string().email().max(150).optional().or(z.literal("")),
  message: z.string().min(2).max(2000),
  relevantProduct: z.string().max(200).optional().or(z.literal("")),
  privacyAccepted: z.boolean(),
});

/**
 * MVP contact form handler.
 * TODO: connect to a real CRM / Base44 lead endpoint / email service once available.
 * TODO: add spam protection (e.g. hCaptcha/Turnstile or honeypot field) before production launch.
 */
export async function POST(request: NextRequest) {
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
  if (!parsed.data.privacyAccepted) {
    return NextResponse.json({ success: false, error: "privacy_not_accepted" }, { status: 400 });
  }

  // Never log full personal details in plaintext production logs long-term;
  // this MVP only logs receipt for debugging until a CRM integration exists.
  console.info("[contact] new message received", {
    hasEmail: Boolean(parsed.data.email),
    hasProduct: Boolean(parsed.data.relevantProduct),
  });

  return NextResponse.json({ success: true });
}
