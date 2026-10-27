import { z } from "zod";
import type { SandboxStep } from "@/types/domain";
import { getWorkflowDetail } from "@/data/workflow-details";
import { getSandboxCopy } from "@/data/sandbox-copy";

export const SANDBOX_TIMEOUT_MS = 15_000; // hard limit (Section 7.3 step 5)
export const MAX_OUTPUT_BYTES = 8 * 1024;
const QUEUE_MS = 300;
const STEP_MS = 550;
const MAX_STEPS = 6;

export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "timeout" | "rate_limited";
export const TERMINAL: RunStatus[] = ["succeeded", "failed", "timeout"];

export interface Snapshot {
  status: RunStatus;
  steps: SandboxStep[];
  output: unknown;
  durationMs: number | null;
}

/** The steps a sandbox run walks through: the workflow's own first nodes (same list the Nodes tab documents). */
export function getSandboxSteps(slug: string): { key: string; label: string }[] {
  const detail = getWorkflowDetail(slug);
  return (detail?.nodes ?? []).slice(0, MAX_STEPS).map((n, i) => ({ key: `s${i}`, label: n.name }));
}

export function capOutput(output: unknown): unknown {
  return JSON.stringify(output ?? null).length > MAX_OUTPUT_BYTES ? { truncated: true, reason: "Output exceeded 8 KB." } : output;
}

/**
 * Mock mode's "n8n": progress is a PURE FUNCTION of elapsed time since the run
 * was created, so the SSE/poll endpoints need no background worker and no
 * writes while streaming — any instance can answer any poll identically.
 */
export function buildMockSnapshot(params: {
  createdAtMs: number;
  nowMs: number;
  steps: { key: string; label: string }[];
  input: string;
  slug: string;
}): Snapshot {
  const elapsed = params.nowMs - params.createdAtMs;
  const total = params.steps.length;
  const doneCount = elapsed < QUEUE_MS ? 0 : Math.min(total, Math.floor((elapsed - QUEUE_MS) / STEP_MS));

  const steps: SandboxStep[] = params.steps.map((s, i) => {
    if (i < doneCount) return { ...s, status: "done", ms: QUEUE_MS + (i + 1) * STEP_MS };
    if (i === doneCount && elapsed >= QUEUE_MS) return { ...s, status: "running" };
    return { ...s, status: "pending" };
  });

  if (doneCount >= total && total > 0) {
    const copy = getSandboxCopy({ integrations: getWorkflowDetail(params.slug)?.integrations ?? [], categories: getWorkflowDetail(params.slug)?.categories ?? [] } as never);
    return {
      status: "succeeded",
      steps,
      output: capOutput({ simulated: true, workflow: params.slug, input: params.input, result: copy.previewNote }),
      durationMs: QUEUE_MS + total * STEP_MS,
    };
  }
  return { status: elapsed < QUEUE_MS ? "queued" : "running", steps, output: null, durationMs: null };
}

/** Live mode: trust the DB row, but enforce the 15s ceiling ourselves — n8n might never call back. */
export function snapshotFromRow(
  row: { status: RunStatus; steps: SandboxStep[] | null; output: unknown; duration_ms: number | null; created_at: string },
  nowMs: number,
): Snapshot {
  const elapsed = nowMs - new Date(row.created_at).getTime();
  if (!TERMINAL.includes(row.status) && elapsed > SANDBOX_TIMEOUT_MS) {
    return { status: "timeout", steps: row.steps ?? [], output: null, durationMs: SANDBOX_TIMEOUT_MS };
  }
  return { status: row.status, steps: row.steps ?? [], output: row.output ?? null, durationMs: row.duration_ms };
}

// ---- n8n → FlowSaaS progress callbacks (POST /api/webhooks/n8n) -------------

export const callbackSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("step"),
    runId: z.string().uuid(),
    key: z.string().min(1).max(40),
    label: z.string().min(1).max(120),
    status: z.enum(["running", "done", "error"]),
    ms: z.number().int().nonnegative().optional(),
    detail: z.string().max(300).optional(),
  }),
  z.object({
    type: z.literal("result"),
    runId: z.string().uuid(),
    status: z.enum(["succeeded", "failed"]),
    output: z.unknown(),
    durationMs: z.number().int().nonnegative(),
  }),
]);
export type SandboxCallback = z.infer<typeof callbackSchema>;

export interface RowUpdate {
  steps?: SandboxStep[];
  status?: RunStatus;
  output?: unknown;
  duration_ms?: number;
}

/**
 * Pure merge of one callback into a run row. Returns null when the update
 * must be ignored: the run is already terminal (a late or replayed callback
 * can't rewrite history) — which also makes the endpoint idempotent.
 */
export function applyCallback(row: { status: RunStatus; steps: SandboxStep[] | null }, cb: SandboxCallback): RowUpdate | null {
  if (TERMINAL.includes(row.status)) return null;

  if (cb.type === "result") {
    return { status: cb.status, output: capOutput(cb.output), duration_ms: cb.durationMs };
  }

  const steps = [...(row.steps ?? [])];
  const index = steps.findIndex((s) => s.key === cb.key);
  const next: SandboxStep = { key: cb.key, label: cb.label, status: cb.status, ...(cb.ms !== undefined ? { ms: cb.ms } : {}), ...(cb.detail ? { detail: cb.detail } : {}) };
  if (index === -1) steps.push(next);
  else steps[index] = next;
  return { steps, status: "running" };
}
