import { NextResponse } from "next/server";
import { publicToolRunRequestSchema } from "@/lib/schema/tool-run";
import { runTool } from "@/lib/tools/run-tool";
import { buildRunToolDeps } from "@/lib/tools/db";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/ratelimit";
import { resolveApiAuth, getUserTier } from "@/lib/api-auth";
import { withIdempotency } from "@/lib/idempotency";
import { redisIdempotencyStore } from "@/lib/redis-stores";

export const runtime = "nodejs";

/** Public API (Section 9.5): `curl -H "Authorization: Bearer fsk_live_..." -d '{"tool":"...","input":{...}}'`. */
export async function POST(request: Request) {
  const auth = await resolveApiAuth(request);
  if (!auth || auth.source !== "api") {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const service = createServiceClient();
  const tier = await getUserTier(service, auth.userId);
  const limitName = tier === "vip" || tier === "enterprise" ? "toolVip" : "toolFree";
  const limit = await checkRateLimit(limitName, auth.userId);
  const limitHeaders = { "X-RateLimit-Limit": String(limit.limit), "X-RateLimit-Remaining": String(Math.max(0, limit.remaining)), "X-RateLimit-Reset": String(limit.reset) };
  if (!limit.success) {
    return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429, headers: limitHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400, headers: limitHeaders });
  }
  const parsed = publicToolRunRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation-failed" }, { status: 422, headers: limitHeaders });
  }

  const result = await withIdempotency(redisIdempotencyStore, auth.userId, request.headers.get("idempotency-key"), async () => {
    const outcome = await runTool(buildRunToolDeps(service), { userId: auth.userId, toolSlug: parsed.data.tool, input: parsed.data.input, source: "api" });
    return { status: outcome.status, body: outcome };
  });

  const creditsHeader = (result.body as { creditsRemaining?: number }).creditsRemaining;
  return NextResponse.json(result.body, {
    status: result.status,
    headers: { ...limitHeaders, ...(creditsHeader !== undefined ? { "X-Credits-Remaining": String(creditsHeader) } : {}) },
  });
}
