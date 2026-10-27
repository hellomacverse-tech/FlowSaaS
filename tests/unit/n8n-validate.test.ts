import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sanitizeWorkflow, sha256Hex, validateWorkflow } from "@/lib/n8n/validate";

const base = {
  name: "Test",
  nodes: [
    { id: "1", name: "Hook", type: "n8n-nodes-base.webhook", typeVersion: 2, position: [0, 0], parameters: {} },
  ],
  connections: {},
};

describe("validateWorkflow", () => {
  it("accepts a clean workflow", () => {
    expect(validateWorkflow(base).ok).toBe(true);
  });

  it("rejects a credentials block anywhere in the tree", () => {
    const bad = { ...base, nodes: [{ ...base.nodes[0], credentials: { googleSheetsOAuth2Api: { id: "1" } } }] };
    const result = validateWorkflow(bad);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/credentials/);
  });

  it("rejects executeCommand and ssh nodes", () => {
    for (const type of ["n8n-nodes-base.executeCommand", "n8n-nodes-base.ssh"]) {
      const bad = { ...base, nodes: [{ ...base.nodes[0], type }] };
      expect(validateWorkflow(bad).ok).toBe(false);
    }
  });

  it("rejects node types outside the allowlist", () => {
    const bad = { ...base, nodes: [{ ...base.nodes[0], type: "n8n-nodes-base.someUnknownNode" }] };
    expect(validateWorkflow(bad).ok).toBe(false);
  });

  it("rejects pinData and oversize files", () => {
    expect(validateWorkflow({ ...base, pinData: { Hook: [{ json: {} }] } }).ok).toBe(false);
    expect(validateWorkflow(base, 1024 * 1024 + 1).ok).toBe(false);
  });
});

describe("sanitizeWorkflow", () => {
  it("strips pinData, instanceId, credentials and webhookId, without mutating the input", () => {
    const dirty = {
      ...base,
      pinData: { a: 1 },
      instanceId: "abc",
      nodes: [{ ...base.nodes[0], credentials: { x: 1 }, webhookId: "w" }],
    };
    const clean = sanitizeWorkflow(dirty);
    expect(validateWorkflow(clean).ok).toBe(true);
    expect(dirty.pinData).toBeDefined();
  });
});

describe("generated launch workflows (release gate)", () => {
  const dir = join(process.cwd(), "n8n", "workflows");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "manifest.json");
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf-8")) as {
    file: string;
    sha256: string;
  }[];

  it("has all 12 workflow files", () => {
    expect(files).toHaveLength(12);
  });

  it.each(files)("%s passes validation and matches its manifest sha256", (file) => {
    const raw = readFileSync(join(dir, file), "utf-8");
    expect(validateWorkflow(JSON.parse(raw), Buffer.byteLength(raw)).ok).toBe(true);
    expect(manifest.find((m) => m.file === file)?.sha256).toBe(sha256Hex(raw));
  });
});
