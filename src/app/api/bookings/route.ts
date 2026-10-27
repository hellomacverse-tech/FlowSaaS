import { NextResponse } from "next/server";
import { bookingRequestSchema } from "@/lib/schema/lead";
import { createServiceClient } from "@/lib/supabase/service";
import { sendBookingConfirmationEmail, sendInternalLeadNotification } from "@/lib/email";
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

  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation-failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const data = parsed.data;

  if (data.honeypot) {
    return NextResponse.json({ ok: false, error: "slot-taken" }, { status: 200 });
  }

  const ip = getClientIp(request.headers);
  const { success } = await checkRateLimit("booking", hashIp(ip));
  if (!success) {
    return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });
  }

  const humanVerified = await verifyTurnstile({ token: data.turnstileToken, secret: env.TURNSTILE_SECRET_KEY, ip });
  if (!humanVerified) {
    return NextResponse.json({ ok: false, error: "turnstile-failed" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Atomic reserve — see migration 0002_book_slot_function.sql for why
  // this is an RPC call rather than a read-then-write.
  const { data: slotResult, error: slotError } = await supabase
    .rpc("book_slot", { p_slot_id: data.slotId })
    .single<{ slot_id: string; ok: boolean }>();

  if (slotError) {
    console.error("book_slot RPC failed:", slotError);
    return NextResponse.json({ ok: false, error: "insert-failed" }, { status: 500 });
  }
  if (!slotResult?.ok) {
    return NextResponse.json({ ok: false, error: "slot-taken" }, { status: 409 });
  }

  const { data: slot } = await supabase
    .from("booking_slots")
    .select("starts_at")
    .eq("id", data.slotId)
    .single();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      type: "contact",
      name: data.fullName,
      email: data.workEmail,
      company: data.company,
      workflows_of_interest: data.workflowsOfInterest,
      message: data.notes || null,
      status: "new",
    })
    .select("id")
    .single();

  if (leadError || !lead) {
    console.error("Failed to insert lead for booking:", leadError);
    return NextResponse.json({ ok: false, error: "insert-failed" }, { status: 500 });
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({ slot_id: data.slotId, lead_id: lead.id, timezone: data.timezone })
    .select("id")
    .single();

  if (bookingError || !booking) {
    console.error("Failed to insert booking:", bookingError);
    return NextResponse.json({ ok: false, error: "insert-failed" }, { status: 500 });
  }

  const dateLabel = slot?.starts_at
    ? new Date(slot.starts_at as string).toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: data.timezone,
      })
    : "your selected time";

  const results = await Promise.allSettled([
    sendBookingConfirmationEmail(data.workEmail, data.fullName, { dateLabel, timezone: data.timezone }),
    sendInternalLeadNotification({
      type: "contact",
      fullName: data.fullName,
      email: data.workEmail,
      company: data.company,
      summary: `Discovery call booked: ${dateLabel} (${data.timezone})\n\n${data.notes}`,
    }),
  ]);
  for (const result of results) {
    if (result.status === "rejected") console.error("Booking email failed:", result.reason);
  }

  return NextResponse.json({ ok: true, bookingId: booking.id as string });
}
