import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/n8n/sign";
import { redisNonceStore } from "@/lib/redis-stores";
import { callbackSchema, applyCallback } from "@/lib/sandbox/state";
import { createServiceClient } from "@/lib/supabase/service";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const verification = await verifyRequest({
    secret: env.N8N_WEBHOOK_SIGNING_SECRET,
    rawBody,
    headers: request.headers,
    nonceStore: redisNonceStore,
  });
  if (!verification.ok) {
    return NextResponse.json({ ok: false, error: verification.reason }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const parsed = callbackSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation-failed" }, { status: 422 });
  }
  const callback = parsed.data;

  const service = createServiceClient();
  const { data: row } = await service.from("sandbox_runs").select("status, steps").eq("id", callback.runId).maybeSingle();
  if (!row) {
    return NextResponse.json({ ok: false, error: "run-not-found" }, { status: 404 });
  }

  const update = applyCallback(row as never, callback);
  if (update) {
    await service.from("sandbox_runs").update(update).eq("id", callback.runId);
  }
  // `update === null` means the run is already terminal — acknowledged as
  // success anyway (200) so n8n doesn't retry a callback that will never apply.

  return NextResponse.json({ ok: true });
}
