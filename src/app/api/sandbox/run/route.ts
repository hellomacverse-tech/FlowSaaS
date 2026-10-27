import { NextResponse } from "next/server";
import { sandboxRunRequestSchema } from "@/lib/schema/sandbox";
import { sanitizeSandboxInput, stripControlChars } from "@/lib/pii";
import { getSandboxSteps } from "@/lib/sandbox/state";
import { getWorkflowDetail } from "@/data/workflow-details";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/ratelimit";
import { getClientIp, hashIp } from "@/lib/hash";
import { verifyTurnstile } from "@/lib/turnstile";
import { env } from "@/lib/env";
import { callN8n, N8nCallError } from "@/lib/n8n/client";

export const runtime = "nodejs";

/**
 * Kicks off a sandbox run (Section 7.3 step 2): Turnstile → rate limit → zod
 * → PII-scrub the input → insert `sandbox_runs(status='queued')` → in live
 * mode, sign and POST to n8n (fire-and-forget: n8n reports progress via
 * `/api/webhooks/n8n`, this call just starts it) → return `{ runId }`. The
 * client then opens `/api/sandbox/stream/{runId}`, which in mock mode needs
 * no n8n call at all — progress is derived purely from elapsed time.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const parsed = sandboxRunRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation-failed" }, { status: 422 });
  }
  const { workflowSlug, input, turnstileToken } = parsed.data;

  const workflow = getWorkflowDetail(workflowSlug);
  if (!workflow || !workflow.sandboxSupported) {
    return NextResponse.json({ ok: false, error: "sandbox-not-supported" }, { status: 404 });
  }

  const verified = await verifyTurnstile({ token: turnstileToken, secret: env.TURNSTILE_SECRET_KEY, ip: getClientIp(request.headers) });
  if (!verified) {
    return NextResponse.json({ ok: false, error: "turnstile-failed" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ip = getClientIp(request.headers);
  const ipHash = hashIp(ip);

  // Anon: 5/h/IP. Signed-in: 20/h/user. Both share a 300/h global breaker.
  const perCallerLimit = user
    ? await checkRateLimit("sandboxUser", user.id)
    : await checkRateLimit("sandboxAnon", ipHash);
  if (!perCallerLimit.success) {
    return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });
  }
  const globalLimit = await checkRateLimit("sandboxGlobal", "global");
  if (!globalLimit.success) {
    return NextResponse.json({ ok: false, error: "rate-limited-global" }, { status: 429 });
  }

  const cleanInput = sanitizeSandboxInput(input);
  const service = createServiceClient();

  const steps = getSandboxSteps(workflowSlug);
  const { data: run, error } = await service
    .from("sandbox_runs")
    .insert({
      workflow_id: null, // static catalog content has no DB id to attach without a lookup this route doesn't need
      user_id: user?.id ?? null,
      anon_fingerprint: user ? null : ipHash,
      ip_hash: ipHash,
      input_text: cleanInput,
      status: "queued",
      steps,
    })
    .select("id")
    .single();

  if (error || !run) {
    console.error("Failed to create sandbox run:", error);
    return NextResponse.json({ ok: false, error: "insert-failed" }, { status: 500 });
  }

  if (env.N8N_MODE === "live") {
    try {
      await callN8n({
        baseUrl: env.N8N_BASE_URL,
        path: env.N8N_SANDBOX_WEBHOOK_PATH,
        body: { runId: run.id, workflowSlug, input: stripControlChars(cleanInput) },
        secret: env.N8N_WEBHOOK_SIGNING_SECRET,
        timeoutMs: 12_000,
        retries: 1,
      });
    } catch (err) {
      // Don't fail the request — the stream endpoint's own 15s ceiling
      // (Section 7.3 step 5) will surface this as a timeout either way, and
      // that's a friendlier failure mode than a 500 on the initial POST.
      const kind = err instanceof N8nCallError ? err.kind : "unknown";
      console.error(`Failed to start n8n sandbox workflow (${kind}):`, err);
    }
  }
  // In mock mode, nothing else needs to happen here — progress is derived
  // from elapsed time by the stream endpoint (`buildMockSnapshot`).

  return NextResponse.json({ ok: true, runId: run.id as string });
}
