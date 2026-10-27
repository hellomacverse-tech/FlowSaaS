import { NextResponse } from "next/server";
import { quoteRequestSchema } from "@/lib/schema/lead";
import { createServiceClient } from "@/lib/supabase/service";
import { sendQuoteConfirmationEmail, sendInternalLeadNotification } from "@/lib/email";
import { checkRateLimit } from "@/lib/ratelimit";
import { getClientIp, hashIp } from "@/lib/hash";
import { verifyTurnstile } from "@/lib/turnstile";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation-failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const data = parsed.data;

  // Honeypot: a filled hidden field means a bot filled every field it
  // could find. Respond 200 with no side effects so the bot doesn't learn
  // which field gave it away.
  if (data.honeypot) {
    return NextResponse.json({ ok: true, leadId: "00000000-0000-0000-0000-000000000000" });
  }

  const ip = getClientIp(request.headers);
  const { success } = await checkRateLimit("quoteForm", hashIp(ip));
  if (!success) {
    return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });
  }

  const humanVerified = await verifyTurnstile({ token: data.turnstileToken, secret: env.TURNSTILE_SECRET_KEY, ip });
  if (!humanVerified) {
    return NextResponse.json({ ok: false, error: "turnstile-failed" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      type: "dfy_quote",
      name: data.fullName,
      email: data.workEmail,
      company: data.company,
      budget_range: data.budgetRange,
      workflows_of_interest: data.workflowsOfInterest,
      message: data.projectDetails,
      utm: data.utm ?? {},
      status: "new",
    })
    .select("id")
    .single();

  if (error || !lead) {
    console.error("Failed to insert lead:", error);
    return NextResponse.json({ ok: false, error: "insert-failed" }, { status: 500 });
  }

  const results = await Promise.allSettled([
    sendQuoteConfirmationEmail(data.workEmail, data.fullName),
    sendInternalLeadNotification({
      type: "dfy_quote",
      fullName: data.fullName,
      email: data.workEmail,
      company: data.company,
      summary: `${data.primaryGoal} · ${data.deploymentTarget} · ${data.budgetRange} · ${data.timeline}\n\n${data.projectDetails}`,
    }),
  ]);
  for (const result of results) {
    if (result.status === "rejected") console.error("Lead email failed:", result.reason);
  }

  return NextResponse.json({ ok: true, leadId: lead.id as string });
}
