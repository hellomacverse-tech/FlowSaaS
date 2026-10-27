/**
 * Run with `pnpm generate:workflows`.
 *
 * IMPORTANT — what these files are: structurally valid, credential-free n8n
 * workflow skeletons generated from the authored node documentation
 * (`src/data/workflow-details.ts`): correct node types, positions, a linear
 * connection chain, per-node notes, and a top-left setup sticky note. They
 * are NOT exports from a live, tested n8n instance, so per-node `parameters`
 * (webhook paths, sheet column mappings, prompts, etc.) are intentionally
 * minimal. Before selling these, replace each with a real export from a
 * tested workflow and run it through `pnpm sanitize:workflows` — that
 * script is the release gate (Section 16, rule 7).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { getAllWorkflowDetails } from "../src/data/workflow-details";
import { sanitizeWorkflow, sha256Hex, validateWorkflow } from "../src/lib/n8n/validate";
import { siteConfig } from "../src/config/site";

const TYPE_MAP: Record<string, { type: string; typeVersion: number }> = {
  Webhook: { type: "n8n-nodes-base.webhook", typeVersion: 2 },
  "Respond to Webhook": { type: "n8n-nodes-base.respondToWebhook", typeVersion: 1 },
  Code: { type: "n8n-nodes-base.code", typeVersion: 2 },
  IF: { type: "n8n-nodes-base.if", typeVersion: 2 },
  Switch: { type: "n8n-nodes-base.switch", typeVersion: 3 },
  "HTTP Request": { type: "n8n-nodes-base.httpRequest", typeVersion: 4 },
  "Google Sheets": { type: "n8n-nodes-base.googleSheets", typeVersion: 4 },
  Telegram: { type: "n8n-nodes-base.telegram", typeVersion: 1 },
  "Telegram Trigger": { type: "n8n-nodes-base.telegramTrigger", typeVersion: 1 },
  Slack: { type: "n8n-nodes-base.slack", typeVersion: 2 },
  Airtable: { type: "n8n-nodes-base.airtable", typeVersion: 2 },
  Gmail: { type: "n8n-nodes-base.gmail", typeVersion: 2 },
  "Gmail Trigger": { type: "n8n-nodes-base.gmailTrigger", typeVersion: 1 },
  "Shopify Trigger": { type: "n8n-nodes-base.shopifyTrigger", typeVersion: 1 },
  WordPress: { type: "n8n-nodes-base.wordpress", typeVersion: 1 },
  "RSS Feed Read": { type: "n8n-nodes-base.rssFeedRead", typeVersion: 1 },
  "Schedule Trigger": { type: "n8n-nodes-base.scheduleTrigger", typeVersion: 1 },
  Wait: { type: "n8n-nodes-base.wait", typeVersion: 1 },
  "Error Trigger": { type: "n8n-nodes-base.errorTrigger", typeVersion: 1 },
  OpenAI: { type: "@n8n/n8n-nodes-langchain.openAi", typeVersion: 1 },
};

/** Deterministic id so regenerating produces byte-identical files (stable sha256). */
function stableId(slug: string, index: number): string {
  const hex = createHash("sha256").update(`${slug}:${index}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

const outDir = join(process.cwd(), "n8n", "workflows");
mkdirSync(outDir, { recursive: true });

const manifest: { slug: string; file: string; version: string; sha256: string; nodeCount: number }[] = [];
let failures = 0;

for (const workflow of getAllWorkflowDetails()) {
  const nodes = workflow.nodes.map((doc, index) => {
    const mapped = TYPE_MAP[doc.type] ?? { type: "n8n-nodes-base.noOp", typeVersion: 1 };
    const graphNode = workflow.graph.nodes[index]!;
    return {
      id: stableId(workflow.slug, index),
      name: doc.name,
      type: mapped.type,
      typeVersion: mapped.typeVersion,
      position: [graphNode.x * 1.4, graphNode.y * 1.6] as [number, number],
      parameters: {},
      notes: doc.credentialsNeeded ? `${doc.purpose} (needs: ${doc.credentialsNeeded})` : doc.purpose,
      notesInFlow: false,
    };
  });

  const stickyNote = {
    id: stableId(workflow.slug, 999),
    name: "FlowSaaS Setup",
    type: "n8n-nodes-base.stickyNote",
    typeVersion: 1,
    position: [0, -140] as [number, number],
    parameters: {
      content: `FlowSaaS v${workflow.currentVersion} — setup guide: ${siteConfig.url}/workflows/${workflow.slug}\n\nConnect your own credentials in each node marked with a warning icon. No credentials are included in this file.`,
      height: 100,
      width: 460,
    },
  };

  const connections: Record<string, { main: { node: string; type: string; index: number }[][] }> = {};
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const from = nodes[i]!;
    const to = nodes[i + 1]!;
    connections[from.name] = { main: [[{ node: to.name, type: "main", index: 0 }]] };
  }

  const raw = {
    name: `${workflow.title} (FlowSaaS v${workflow.currentVersion})`,
    nodes: [stickyNote, ...nodes],
    connections,
    active: false,
    settings: { executionOrder: "v1" },
    meta: { flowsaasSlug: workflow.slug, flowsaasVersion: workflow.currentVersion },
  };

  const sanitized = sanitizeWorkflow(raw);
  const json = `${JSON.stringify(sanitized, null, 2)}\n`;
  const result = validateWorkflow(sanitized, Buffer.byteLength(json));

  if (!result.ok) {
    failures += 1;
    console.error(`FAIL ${workflow.slug}:\n  - ${result.errors.join("\n  - ")}`);
    continue;
  }

  const file = `${workflow.slug}.json`;
  writeFileSync(join(outDir, file), json);
  manifest.push({
    slug: workflow.slug,
    file,
    version: workflow.currentVersion,
    sha256: sha256Hex(json),
    nodeCount: workflow.nodes.length,
  });
  console.log(`ok   ${file} (${workflow.nodes.length} nodes)`);
}

writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

if (failures > 0) {
  console.error(`${failures} workflow(s) failed validation.`);
  process.exit(1);
}
console.log(`Wrote ${manifest.length} workflows + manifest.json`);
