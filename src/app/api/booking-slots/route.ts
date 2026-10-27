import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const querySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

/**
 * Booking slots have no client-readable RLS policy (writes/reads both go
 * through the service role — see the migration's RLS section), since
 * exposing raw capacity/booked counts to anon `select` would work too, but
 * routing it through a server endpoint keeps the door open for filtering
 * out slots reserved for specific packages later without a schema change.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid-range" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("booking_slots")
    .select("id, starts_at, ends_at, capacity, booked")
    .gte("starts_at", parsed.data.from)
    .lt("starts_at", parsed.data.to)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Failed to load booking slots:", error);
    return NextResponse.json({ ok: false, error: "query-failed" }, { status: 500 });
  }

  const openSlots = (data ?? [])
    .filter((slot) => slot.booked < slot.capacity)
    .map((slot) => ({ id: slot.id as string, startsAt: slot.starts_at as string }));

  return NextResponse.json({ ok: true, slots: openSlots });
}
