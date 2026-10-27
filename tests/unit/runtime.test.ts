import { describe, expect, it } from "vitest";
import { applyCallback, buildMockSnapshot, callbackSchema, capOutput, getSandboxSteps, snapshotFromRow, SANDBOX_TIMEOUT_MS, MAX_OUTPUT_BYTES } from "@/lib/sandbox/state";
import { credentialChecklist, DeployPrepError, prepareForDeploy } from "@/lib/n8n/deploy";
import { readFileSync } from "node:fs";

const SLUG = "facebook-messenger-crm-google-sheets";
const steps = getSandboxSteps(SLUG);
const snap = (elapsed: number) => buildMockSnapshot({ createdAtMs: 0, nowMs: elapsed, steps, input: "hi", slug: SLUG });

describe("sandbox mock progression", () => {
  it("derives steps from the workflow's own nodes, capped at 6", () => {
    expect(steps.length).toBe(6);
    expect(steps[0]!.label).toBe("Messenger Webhook");
  });
  it("is queued, then runs one step at a time, then succeeds", () => {
    expect(snap(0)).toMatchObject({ status: "queued" });
    const mid = snap(300 + 550 * 2 + 10);
    expect(mid.status).toBe("running");
    expect(mid.steps.map((s) => s.status)).toEqual(["done", "done", "running", "pending", "pending", "pending"]);
    const end = snap(300 + 550 * 6);
    expect(end.status).toBe("succeeded");
    expect(end.steps.every((s) => s.status === "done")).toBe(true);
    expect(end.durationMs).toBe(300 + 550 * 6);
    expect((end.output as { simulated: boolean }).simulated).toBe(true);
  });
  it("is a pure function of time — same inputs, same answer; total run is well under the 15s cap", () => {
    expect(snap(1234)).toEqual(snap(1234));
    expect(300 + 550 * 6).toBeLessThan(SANDBOX_TIMEOUT_MS);
  });
  it("labels mock output as simulated (Section 16: never present simulated output as real)", () => {
    expect(JSON.stringify(snap(99_999).output)).toContain('"simulated":true');
  });
});

describe("live-mode snapshot", () => {
  const row = (status: "queued" | "running" | "succeeded", ageMs: number) => ({
    status, steps: [], output: status === "succeeded" ? { ok: 1 } : null, duration_ms: null, created_at: new Date(1_000_000 - ageMs).toISOString(),
  });
  it("times out a non-terminal run older than 15s (n8n may never call back)", () => {
    expect(snapshotFromRow(row("running", SANDBOX_TIMEOUT_MS + 1), 1_000_000).status).toBe("timeout");
    expect(snapshotFromRow(row("queued", SANDBOX_TIMEOUT_MS + 1), 1_000_000).status).toBe("timeout");
  });
  it("leaves fresh and already-succeeded runs alone", () => {
    expect(snapshotFromRow(row("running", 5000), 1_000_000).status).toBe("running");
    expect(snapshotFromRow(row("succeeded", SANDBOX_TIMEOUT_MS * 10), 1_000_000).status).toBe("succeeded");
  });
});

describe("output cap", () => {
  it("passes small payloads and replaces anything over 8 KB", () => {
    expect(capOutput({ a: 1 })).toEqual({ a: 1 });
    expect(capOutput({ blob: "x".repeat(MAX_OUTPUT_BYTES + 1) })).toMatchObject({ truncated: true });
  });
});

describe("n8n callbacks", () => {
  const runId = "123e4567-e89b-12d3-a456-426614174000";
  it("validates the payload shape", () => {
    expect(callbackSchema.safeParse({ type: "step", runId, key: "s0", label: "x", status: "done", ms: 12 }).success).toBe(true);
    expect(callbackSchema.safeParse({ type: "step", runId: "nope", key: "s0", label: "x", status: "done" }).success).toBe(false);
    expect(callbackSchema.safeParse({ type: "step", runId, key: "s0", label: "x", status: "weird" }).success).toBe(false);
    expect(callbackSchema.safeParse({ type: "result", runId, status: "succeeded", output: {}, durationMs: -1 }).success).toBe(false);
    expect(callbackSchema.safeParse({ type: "nope" }).success).toBe(false);
  });
  it("upserts steps by key and marks the run running", () => {
    const a = applyCallback({ status: "queued", steps: [] }, { type: "step", runId, key: "s0", label: "Hook", status: "running" })!;
    expect(a).toMatchObject({ status: "running", steps: [{ key: "s0", status: "running" }] });
    const b = applyCallback({ status: "running", steps: a.steps! }, { type: "step", runId, key: "s0", label: "Hook", status: "done", ms: 40 })!;
    expect(b.steps).toEqual([{ key: "s0", label: "Hook", status: "done", ms: 40 }]);
    const c = applyCallback({ status: "running", steps: b.steps! }, { type: "step", runId, key: "s1", label: "Next", status: "running" })!;
    expect(c.steps).toHaveLength(2);
  });
  it("applies a result, capping oversized output", () => {
    const r = applyCallback({ status: "running", steps: [] }, { type: "result", runId, status: "succeeded", output: { x: "y".repeat(9000) }, durationMs: 1234 })!;
    expect(r).toMatchObject({ status: "succeeded", duration_ms: 1234, output: { truncated: true } });
  });
  it("ignores callbacks for terminal runs (late or replayed callbacks can't rewrite history)", () => {
    for (const status of ["succeeded", "failed", "timeout"] as const) {
      expect(applyCallback({ status, steps: [] }, { type: "result", runId, status: "failed", output: null, durationMs: 1 })).toBeNull();
      expect(applyCallback({ status, steps: [] }, { type: "step", runId, key: "s", label: "l", status: "done" })).toBeNull();
    }
  });
});

describe("prepareForDeploy", () => {
  const file = readFileSync("n8n/workflows/facebook-messenger-crm-google-sheets.json", "utf-8");
  it("renames, forces inactive, and passes a real launch file", () => {
    const out = prepareForDeploy(file, { title: "Facebook Messenger CRM", version: "1.0.0" }) as { name: string; active: boolean };
    expect(out.name).toBe("Facebook Messenger CRM (FlowSaaS v1.0.0)");
    expect(out.active).toBe(false);
  });
  it("strips pinData and credentials rather than shipping them, then validates", () => {
    const dirty = JSON.parse(file);
    dirty.pinData = { x: 1 };
    dirty.nodes[1].credentials = { a: 1 };
    const out = prepareForDeploy(JSON.stringify(dirty), { title: "T", version: "1" }) as Record<string, unknown>;
    expect(out).not.toHaveProperty("pinData");
    // The sticky note legitimately mentions the word "credentials" in its
    // instructions; what must never appear is an actual `credentials` KEY on
    // any node (a real secret-bearing block), which is what the allowlist
    // validator (already invoked inside prepareForDeploy) checks for.
    const nodes = (out as { nodes: Record<string, unknown>[] }).nodes;
    expect(nodes.every((n) => !("credentials" in n))).toBe(true);
  });
  it("rejects command-execution nodes, unknown types, bad JSON and oversize files", () => {
    const bad = JSON.parse(file);
    bad.nodes[1].type = "n8n-nodes-base.executeCommand";
    expect(() => prepareForDeploy(JSON.stringify(bad), { title: "T", version: "1" })).toThrow(DeployPrepError);
    bad.nodes[1].type = "n8n-nodes-base.mystery";
    expect(() => prepareForDeploy(JSON.stringify(bad), { title: "T", version: "1" })).toThrow(DeployPrepError);
    expect(() => prepareForDeploy("{not json", { title: "T", version: "1" })).toThrow(DeployPrepError);
    expect(() => prepareForDeploy(JSON.stringify({ ...JSON.parse(file), pad: "x".repeat(1024 * 1024) }), { title: "T", version: "1" })).toThrow(DeployPrepError);
  });
  it("builds a de-duplicated credentials checklist", () => {
    expect(credentialChecklist([{ credentialsNeeded: "A" }, { credentialsNeeded: null }, { credentialsNeeded: "A" }, { credentialsNeeded: "B" }])).toEqual(["A", "B"]);
  });
});
