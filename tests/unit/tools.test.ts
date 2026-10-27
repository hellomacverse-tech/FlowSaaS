import { describe, expect, it, vi } from "vitest";
import { toolSeeds } from "@/data/tools";
import { runMockTool } from "@/lib/tools/mock";
import { validateAgainst } from "@/lib/tools/validate";
import { runTool, type RunToolDeps, type ToolRecord } from "@/lib/tools/run-tool";
import { callN8n, N8nCallError } from "@/lib/n8n/client";
import { verifyRequest, InMemoryNonceStore } from "@/lib/n8n/sign";

const tool: ToolRecord = {
  id: "tool-1",
  slug: "order-alert-composer",
  creditsPerRun: 2,
  inputSchema: toolSeeds.find((t) => t.slug === "order-alert-composer")!.inputSchema,
  outputSchema: toolSeeds.find((t) => t.slug === "order-alert-composer")!.outputSchema,
};
const validInput = toolSeeds.find((t) => t.slug === "order-alert-composer")!.exampleInput;
const goodOutput = { message: "hi", priority: "normal" };

function deps(over: Partial<RunToolDeps> = {}): RunToolDeps & { recordRun: ReturnType<typeof vi.fn> } {
  const recordRun = vi.fn().mockResolvedValue({ insufficient: false, runId: "run-1", charged: 2, remaining: 8 });
  return {
    getTool: async () => tool,
    getCredits: async () => ({ included: 10, used: 0, remaining: 10 }),
    callTool: async () => ({ kind: "ok", output: goodOutput }),
    recordRun,
    ...over,
  } as never;
}
const run = (d: RunToolDeps, input: unknown = validInput) => runTool(d, { userId: "u1", toolSlug: tool.slug, input, source: "api" });

describe("tool registry", () => {
  it("has the five launch tools with unique slugs and positive costs", () => {
    expect(toolSeeds.map((t) => t.slug).sort()).toEqual([
      "caption-distributor", "lead-query-enricher", "messenger-lead-parser", "order-alert-composer", "support-ticket-triage",
    ]);
    for (const t of toolSeeds) expect(t.creditsPerRun).toBeGreaterThan(0);
  });

  it.each(toolSeeds.map((t) => [t.slug, t] as const))("%s: example input is valid and mock output satisfies the output schema", (slug, t) => {
    const input = validateAgainst(`in:${slug}`, t.inputSchema, t.exampleInput);
    expect(input.ok, input.errors.join(", ")).toBe(true);
    const out = validateAgainst(`out:${slug}`, t.outputSchema, runMockTool(slug, input.value as Record<string, unknown>));
    expect(out.ok, out.errors.join(", ")).toBe(true);
  });

  it("applies schema defaults without mutating the caller's object", () => {
    const t = toolSeeds.find((x) => x.slug === "lead-query-enricher")!;
    const original = { businessType: "cafe", city: "Ajman" };
    const r = validateAgainst("in:lead-query-enricher", t.inputSchema, original);
    expect(r.value).toMatchObject({ minRating: 4, limit: 5 });
    expect(original).toEqual({ businessType: "cafe", city: "Ajman" });
  });

  it("rejects extra properties, wrong types and missing fields", () => {
    const t = toolSeeds.find((x) => x.slug === "support-ticket-triage")!;
    for (const bad of [{ subject: "a", body: "short" }, { subject: "a", body: "long enough body here", extra: 1 }, { body: "long enough body here" }, { subject: 5, body: "long enough body here" }]) {
      expect(validateAgainst("in:support-ticket-triage", t.inputSchema, bad).ok).toBe(false);
    }
  });

  it("mock X captions never exceed 280 characters", () => {
    const out = runMockTool("caption-distributor", { post: "x".repeat(2000), channels: ["x"] }) as { variants: { x: string } };
    expect(out.variants.x.length).toBeLessThanOrEqual(280);
  });
});

describe("runTool", () => {
  it("succeeds, charges the tool's cost, and records a succeeded run", async () => {
    const d = deps();
    const r = await run(d);
    expect(r).toMatchObject({ ok: true, runId: "run-1", creditsCharged: 2, creditsRemaining: 8, output: goodOutput });
    expect(d.recordRun).toHaveBeenCalledWith(expect.objectContaining({ status: "succeeded", credits: 2, source: "api", userId: "u1" }));
  });

  it("404 for an unknown tool, without touching credits or n8n", async () => {
    const callTool = vi.fn();
    const r = await run(deps({ getTool: async () => null, callTool }));
    expect(r).toMatchObject({ ok: false, status: 404, code: "tool-not-found" });
    expect(callTool).not.toHaveBeenCalled();
  });

  it("422 on invalid input BEFORE spending an n8n execution or recording anything", async () => {
    const d = deps({ callTool: vi.fn() });
    const r = await run(d, { orderNumber: "#1" });
    expect(r).toMatchObject({ ok: false, status: 422, code: "invalid-input" });
    expect((r as { details: string[] }).details.length).toBeGreaterThan(0);
    expect(d.callTool).not.toHaveBeenCalled();
    expect(d.recordRun).not.toHaveBeenCalled();
  });

  it("402 when credits are below the tool's cost, and does not call n8n", async () => {
    const d = deps({ getCredits: async () => ({ included: 10, used: 9, remaining: 1 }), callTool: vi.fn() });
    const r = await run(d);
    expect(r).toMatchObject({ ok: false, status: 402, code: "insufficient-credits", creditsRemaining: 1 });
    expect(d.callTool).not.toHaveBeenCalled();
  });

  it("allows a run when remaining exactly equals the cost", async () => {
    expect(await run(deps({ getCredits: async () => ({ included: 10, used: 8, remaining: 2 }) }))).toMatchObject({ ok: true });
  });

  it("402 when the profile can't be read at all (fail closed)", async () => {
    expect(await run(deps({ getCredits: async () => null }))).toMatchObject({ ok: false, status: 402 });
  });

  it.each([
    ["upstream 500", { kind: "upstream-error", status: 500 } as const, 502, "failed", "upstream-error"],
    ["timeout", { kind: "timeout" } as const, 504, "timeout", "timeout"],
    ["schema-invalid output", { kind: "ok", output: { message: 5 } } as const, 502, "failed", "invalid-output"],
    ["output with a disallowed enum", { kind: "ok", output: { message: "m", priority: "critical" } } as const, 502, "failed", "invalid-output"],
  ])("%s → not charged, recorded as %s with 0 credits", async (_name, result, httpStatus, recordedStatus, code) => {
    const d = deps({ callTool: async () => result });
    const r = await run(d);
    expect(r).toMatchObject({ ok: false, status: httpStatus, code });
    expect(d.recordRun).toHaveBeenCalledWith(expect.objectContaining({ status: recordedStatus, credits: 0 }));
  });

  it("withholds output and reports 402 if the atomic charge loses a race", async () => {
    const d = deps({ recordRun: vi.fn().mockResolvedValue({ insufficient: true, remaining: 0 }) });
    const r = await run(d);
    expect(r).toMatchObject({ ok: false, status: 402, code: "insufficient-credits" });
    expect(r).not.toHaveProperty("output");
  });

  it("records the schema-defaulted input, not the raw input", async () => {
    const t: ToolRecord = { ...toolSeedRecord("lead-query-enricher"), creditsPerRun: 1 };
    const d = deps({ getTool: async () => t, callTool: async () => ({ kind: "ok", output: { leads: [] } }) });
    await runTool(d, { userId: "u", toolSlug: t.slug, input: { businessType: "cafe", city: "Ajman" }, source: "dashboard" });
    expect(d.recordRun).toHaveBeenCalledWith(expect.objectContaining({ input: { businessType: "cafe", city: "Ajman", minRating: 4, limit: 5 }, source: "dashboard" }));
  });
});

function toolSeedRecord(slug: string): ToolRecord {
  const s = toolSeeds.find((t) => t.slug === slug)!;
  return { id: `id-${slug}`, slug, creditsPerRun: s.creditsPerRun, inputSchema: s.inputSchema, outputSchema: s.outputSchema };
}

describe("callN8n", () => {
  const base = { baseUrl: "https://n8n.example.com", path: "/webhook/tools/x", body: { a: 1 }, secret: "s".repeat(40), timeoutMs: 1000, jitterMs: () => 0 };
  const res = (status: number, json: unknown = {}) => ({ status, json: async () => json }) as Response;

  it("signs every attempt with a fresh nonce and the signature verifies", async () => {
    const seen: Headers[] = [];
    const bodies: string[] = [];
    const fetchImpl = vi.fn(async (_u: unknown, init?: RequestInit) => {
      seen.push(new Headers(init?.headers));
      bodies.push(String(init?.body));
      return res(seen.length === 1 ? 503 : 200, { ok: true });
    }) as unknown as typeof fetch;
    const r = await callN8n({ ...base, fetchImpl });
    expect(r).toEqual({ status: 200, json: { ok: true } });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(seen[0]!.get("x-flowsaas-nonce")).not.toBe(seen[1]!.get("x-flowsaas-nonce"));
    const store = new InMemoryNonceStore();
    for (let i = 0; i < 2; i += 1) {
      expect(await verifyRequest({ secret: base.secret, rawBody: bodies[i]!, headers: seen[i]!, nonceStore: store })).toEqual({ ok: true });
    }
  });

  it("retries once on 502/503 then returns the failing status (no infinite retry)", async () => {
    const fetchImpl = vi.fn(async () => res(502)) as unknown as typeof fetch;
    expect((await callN8n({ ...base, fetchImpl })).status).toBe(502);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not retry 4xx / 500", async () => {
    for (const s of [400, 401, 500]) {
      const fetchImpl = vi.fn(async () => res(s)) as unknown as typeof fetch;
      expect((await callN8n({ ...base, fetchImpl })).status).toBe(s);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    }
  });

  it("classifies timeouts and network errors, and never retries them", async () => {
    const timeout = vi.fn(async () => { throw Object.assign(new Error("t"), { name: "TimeoutError" }); }) as unknown as typeof fetch;
    await expect(callN8n({ ...base, fetchImpl: timeout })).rejects.toMatchObject({ kind: "timeout" });
    expect(timeout).toHaveBeenCalledTimes(1);
    const net = vi.fn(async () => { throw new Error("ECONNREFUSED"); }) as unknown as typeof fetch;
    await expect(callN8n({ ...base, fetchImpl: net })).rejects.toBeInstanceOf(N8nCallError);
    expect(net).toHaveBeenCalledTimes(1);
  });
});
