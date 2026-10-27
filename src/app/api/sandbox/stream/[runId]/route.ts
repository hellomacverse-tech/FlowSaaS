import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buildMockSnapshot, getSandboxSteps, snapshotFromRow, TERMINAL, type Snapshot } from "@/lib/sandbox/state";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const POLL_INTERVAL_MS = 800;

interface RunRow {
  id: string;
  workflow_id: string | null;
  status: "queued" | "running" | "succeeded" | "failed" | "timeout" | "rate_limited";
  steps: unknown;
  output: unknown;
  duration_ms: number | null;
  input_text: string;
  created_at: string;
}
async function loadRun(service: ReturnType<typeof createServiceClient>, runId: string): Promise<RunRow | null> {
  const { data } = await service
    .from("sandbox_runs")
    .select("id, workflow_id, status, steps, output, duration_ms, input_text, created_at")
    .eq("id", runId)
    .maybeSingle();
  return (data as RunRow | null) ?? null;
}

/**
 * Slug isn't stored on the row (Section 5's `sandbox_runs.workflow_id` points
 * at the real `workflows` table, which the static catalog content this demo
 * reads from doesn't share ids with — see the Phase 4 README note on the
 * same mismatch for checkout). The mock runner only needs the step list and
 * input text, both already on the row, so no slug lookup is required here.
 */
function computeSnapshot(row: RunRow, nowMs: number): Snapshot {
  if (env.N8N_MODE === "live" || TERMINAL.includes(row.status)) {
    return snapshotFromRow({ ...row, steps: row.steps as never }, nowMs);
  }
  const steps = (row.steps as { key: string; label: string }[] | null) ?? getSandboxSteps("");
  return buildMockSnapshot({ createdAtMs: new Date(row.created_at).getTime(), nowMs, steps, input: row.input_text, slug: "" });
}

async function persistIfTerminal(service: ReturnType<typeof createServiceClient>, runId: string, row: RunRow, snapshot: Snapshot) {
  if (env.N8N_MODE !== "mock" || !TERMINAL.includes(snapshot.status) || TERMINAL.includes(row.status)) return;
  // Mock snapshots are computed, never written, until they resolve — then
  // persisted once so `downloads`-style history and re-fetches are stable.
  await service.from("sandbox_runs").update({ status: snapshot.status, steps: snapshot.steps, output: snapshot.output, duration_ms: snapshot.durationMs }).eq("id", runId);
}

function toEvent(snapshot: Snapshot): { event: "step" | "result"; data: unknown } {
  if (TERMINAL.includes(snapshot.status)) {
    return { event: "result", data: { status: snapshot.status, steps: snapshot.steps, output: snapshot.output, durationMs: snapshot.durationMs } };
  }
  return { event: "step", data: { status: snapshot.status, steps: snapshot.steps } };
}

export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const service = createServiceClient();
  const url = new URL(request.url);

  // Poll fallback (Section 7.3 step 3): plain JSON of the current snapshot,
  // for clients where SSE is blocked by a proxy.
  if (url.searchParams.get("poll") === "1") {
    const row = await loadRun(service, runId);
    if (!row) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    const snapshot = computeSnapshot(row, Date.now());
    await persistIfTerminal(service, runId, row, snapshot);
    return NextResponse.json({ ok: true, ...toEvent(snapshot) });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      const row = await loadRun(service, runId);
      if (!row) {
        send("error", { error: "not-found" });
        controller.close();
        return;
      }

      const interval = setInterval(async () => {
        try {
          const current = await loadRun(service, runId);
          if (!current) {
            send("error", { error: "not-found" });
            clearInterval(interval);
            controller.close();
            return;
          }
          const snapshot = computeSnapshot(current, Date.now());
          await persistIfTerminal(service, runId, current, snapshot);
          const { event, data } = toEvent(snapshot);
          send(event, data);
          if (TERMINAL.includes(snapshot.status)) {
            clearInterval(interval);
            closed = true;
            controller.close();
          }
        } catch (err) {
          console.error("Sandbox stream tick failed:", err);
          clearInterval(interval);
          closed = true;
          controller.close();
        }
      }, POLL_INTERVAL_MS);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        closed = true;
      });
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
