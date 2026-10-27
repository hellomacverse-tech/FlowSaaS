import { validateAgainst } from "./validate";

export interface ToolRecord {
  id: string;
  slug: string;
  creditsPerRun: number;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export interface CreditStatus {
  included: number;
  used: number;
  remaining: number;
}

export type ToolCallResult =
  | { kind: "ok"; output: unknown }
  | { kind: "upstream-error"; status: number }
  | { kind: "timeout" };

export interface RecordRunInput {
  userId: string;
  toolId: string;
  status: "succeeded" | "failed" | "timeout";
  input: unknown;
  output: unknown;
  error: string | null;
  credits: number;
  durationMs: number;
  source: "dashboard" | "api";
}

export type RecordRunResult =
  | { insufficient: false; runId: string; charged: number; remaining: number }
  | { insufficient: true; remaining: number };

/** Everything runTool touches outside itself — injected so the orchestration is unit-testable. */
export interface RunToolDeps {
  getTool(slug: string): Promise<ToolRecord | null>;
  getCredits(userId: string): Promise<CreditStatus | null>;
  callTool(tool: ToolRecord, input: unknown): Promise<ToolCallResult>;
  recordRun(input: RecordRunInput): Promise<RecordRunResult>;
  now?: () => number;
}

export type RunToolOutcome =
  | { ok: true; status: 200; runId: string; output: unknown; creditsCharged: number; creditsRemaining: number; durationMs: number }
  | { ok: false; status: 402 | 404 | 422 | 502 | 504; code: string; message: string; details?: string[]; creditsRemaining?: number };

/**
 * The one service behind both `POST /api/tools/{slug}/run` (session) and
 * `POST /api/v1/run` (API key) — Section 7.5:
 *   load tool → validate input → check credits (402) → call n8n → validate
 *   output → record run + charge, atomically.
 * Ordering encodes the money rules: input is validated BEFORE spending an n8n
 * execution; output is validated BEFORE charging; anything that fails after
 * the tool was called is recorded with 0 credits ("failed runs are not
 * charged"); and the charge itself is the last, atomic step.
 * Authentication happens in the caller — this takes an already-trusted userId.
 */
export async function runTool(
  deps: RunToolDeps,
  params: { userId: string; toolSlug: string; input: unknown; source: "dashboard" | "api" },
): Promise<RunToolOutcome> {
  const now = deps.now ?? Date.now;

  const tool = await deps.getTool(params.toolSlug);
  if (!tool) return { ok: false, status: 404, code: "tool-not-found", message: "Unknown tool." };

  const inputCheck = validateAgainst(`in:${tool.slug}`, tool.inputSchema, params.input);
  if (!inputCheck.ok) {
    return { ok: false, status: 422, code: "invalid-input", message: "Input does not match the tool's schema.", details: inputCheck.errors };
  }

  const credits = await deps.getCredits(params.userId);
  if (!credits || credits.remaining < tool.creditsPerRun) {
    return {
      ok: false,
      status: 402,
      code: "insufficient-credits",
      message: `This tool costs ${tool.creditsPerRun} credit${tool.creditsPerRun === 1 ? "" : "s"}; you have ${credits?.remaining ?? 0} left. Upgrade or buy a credit pack.`,
      creditsRemaining: credits?.remaining ?? 0,
    };
  }

  const started = now();
  const record = (status: RecordRunInput["status"], output: unknown, error: string | null, chargeable: boolean) =>
    deps.recordRun({
      userId: params.userId,
      toolId: tool.id,
      status,
      input: inputCheck.value,
      output,
      error,
      credits: chargeable ? tool.creditsPerRun : 0,
      durationMs: now() - started,
      source: params.source,
    });

  const result = await deps.callTool(tool, inputCheck.value);

  if (result.kind === "timeout") {
    await record("timeout", null, "The tool took too long and was stopped.", false);
    return { ok: false, status: 504, code: "timeout", message: "The tool took too long. You were not charged.", creditsRemaining: credits.remaining };
  }
  if (result.kind === "upstream-error") {
    await record("failed", null, `Upstream returned ${result.status}`, false);
    return { ok: false, status: 502, code: "upstream-error", message: "The tool failed to run. You were not charged.", creditsRemaining: credits.remaining };
  }

  const outputCheck = validateAgainst(`out:${tool.slug}`, tool.outputSchema, result.output);
  if (!outputCheck.ok) {
    await record("failed", null, `Invalid output: ${outputCheck.errors.join("; ")}`, false);
    return { ok: false, status: 502, code: "invalid-output", message: "The tool returned an unexpected result. You were not charged.", creditsRemaining: credits.remaining };
  }

  const recorded = await record("succeeded", outputCheck.value, null, true);
  if (recorded.insufficient) {
    // Lost a race: concurrent requests spent the credits after our pre-check.
    // Nothing was charged or stored; withhold the output rather than give it away.
    return { ok: false, status: 402, code: "insufficient-credits", message: "You ran out of credits while this was running. You were not charged.", creditsRemaining: recorded.remaining };
  }

  return {
    ok: true,
    status: 200,
    runId: recorded.runId,
    output: outputCheck.value,
    creditsCharged: recorded.charged,
    creditsRemaining: recorded.remaining,
    durationMs: now() - started,
  };
}
