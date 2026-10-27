import { NextResponse } from "next/server";
import { toolRunRequestSchema } from "@/lib/schema/tool-run";
import { runTool } from "@/lib/tools/run-tool";
import { buildRunToolDeps } from "@/lib/tools/db";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/ratelimit";
import { getUserTier } from "@/lib/api-auth";
import { withIdempotency } from "@/lib/idempotency";
import { redisIdempotencyStore } from "@/lib/redis-stores";

export const runtime = "nodejs";

function headers(result: { creditsRemaining?: number }) {
  return result.creditsRemaining !== undefined ? { "X-Credits-Remaining": String(result.creditsRemaining) } : {};
}

/**
 * Dashboard entry point to `runTool` (Section 9.5). Auth is a plain session
 * cookie — `/api/v1/run` is the Bearer-key twin, both call the same service.
 */
export async function POST(request: Request, { params }: { params: Promise<{ toolSlug: string }> }) {
  const { toolSlug } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const service = createServiceClient();
  const tier = await getUserTier(service, user.id);
  const limit = await checkRateLimit(tier === "vip" || tier === "enterprise" ? "toolVip" : "toolFree", user.id);
  if (!limit.success) return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  const parsed = toolRunRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation-failed" }, { status: 422 });

  const result = await withIdempotency(redisIdempotencyStore, user.id, request.headers.get("idempotency-key"), async () => {
    const outcome = await runTool(buildRunToolDeps(service), { userId: user.id, toolSlug, input: parsed.data.input, source: "dashboard" });
    return { status: outcome.status, body: outcome };
  });

  return NextResponse.json(result.body, { status: result.status, headers: headers(result.body as { creditsRemaining?: number }) });
}
