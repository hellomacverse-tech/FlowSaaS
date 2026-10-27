import { z } from "zod";
import { createHash } from "node:crypto";

/**
 * Node types FlowSaaS workflows are allowed to contain. Anything outside
 * this list is rejected — notably `executeCommand` and `ssh`, which would
 * let a workflow run arbitrary commands on whatever n8n instance imports
 * it (Section 7.4: "no executeCommand/ssh nodes").
 */
export const ALLOWED_NODE_TYPES = new Set([
  "n8n-nodes-base.webhook",
  "n8n-nodes-base.respondToWebhook",
  "n8n-nodes-base.code",
  "n8n-nodes-base.if",
  "n8n-nodes-base.switch",
  "n8n-nodes-base.httpRequest",
  "n8n-nodes-base.googleSheets",
  "n8n-nodes-base.telegram",
  "n8n-nodes-base.telegramTrigger",
  "n8n-nodes-base.slack",
  "n8n-nodes-base.airtable",
  "n8n-nodes-base.gmail",
  "n8n-nodes-base.gmailTrigger",
  "n8n-nodes-base.shopifyTrigger",
  "n8n-nodes-base.wordpress",
  "n8n-nodes-base.rssFeedRead",
  "n8n-nodes-base.scheduleTrigger",
  "n8n-nodes-base.wait",
  "n8n-nodes-base.errorTrigger",
  "n8n-nodes-base.stickyNote",
  "n8n-nodes-base.noOp",
  "@n8n/n8n-nodes-langchain.openAi",
]);

const FORBIDDEN_NODE_TYPES = new Set(["n8n-nodes-base.executeCommand", "n8n-nodes-base.ssh"]);

export const MAX_WORKFLOW_BYTES = 1024 * 1024; // 1 MB

const nodeSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    typeVersion: z.number(),
    position: z.tuple([z.number(), z.number()]),
    parameters: z.record(z.unknown()),
  })
  .passthrough();

export const n8nWorkflowSchema = z
  .object({
    name: z.string(),
    nodes: z.array(nodeSchema),
    connections: z.record(z.unknown()),
    active: z.boolean().optional(),
    settings: z.record(z.unknown()).optional(),
  })
  .passthrough();

export type N8nWorkflow = z.infer<typeof n8nWorkflowSchema>;

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/** Recursively checks an object for any `credentials` key, at any depth. */
function containsCredentialsBlock(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsCredentialsBlock);
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "credentials") return true;
      if (containsCredentialsBlock(child)) return true;
    }
  }
  return false;
}

/**
 * Release-gate validation for every FlowSaaS workflow JSON, and the same
 * check the "Deploy to My n8n Instance" route re-runs on the entitled
 * file before POSTing it to a customer's instance (Section 7.4). Pure
 * function: no I/O, so it's trivially unit-testable.
 */
export function validateWorkflow(input: unknown, rawSizeBytes?: number): ValidationResult {
  const errors: string[] = [];

  const parsed = n8nWorkflowSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  const workflow = parsed.data;

  if (rawSizeBytes !== undefined && rawSizeBytes > MAX_WORKFLOW_BYTES) {
    errors.push(`Workflow is ${rawSizeBytes} bytes, over the ${MAX_WORKFLOW_BYTES}-byte limit.`);
  }

  for (const node of workflow.nodes) {
    if (FORBIDDEN_NODE_TYPES.has(node.type)) {
      errors.push(`Node "${node.name}" uses forbidden type ${node.type}.`);
    } else if (!ALLOWED_NODE_TYPES.has(node.type)) {
      errors.push(`Node "${node.name}" uses type ${node.type}, which is not on the allowlist.`);
    }
  }

  if (containsCredentialsBlock(workflow)) {
    errors.push("Workflow contains a `credentials` block; credentials must never be embedded.");
  }

  if ("pinData" in workflow) {
    errors.push("Workflow contains `pinData`; pinned execution data must be stripped.");
  }

  return { ok: errors.length === 0, errors };
}

/** Removes anything that must not ship: pinData, instance/webhook identifiers. */
export function sanitizeWorkflow<T extends Record<string, unknown>>(workflow: T): T {
  const clone = JSON.parse(JSON.stringify(workflow)) as Record<string, unknown>;
  delete clone.pinData;
  delete clone.instanceId;

  if (Array.isArray(clone.nodes)) {
    for (const node of clone.nodes as Record<string, unknown>[]) {
      delete node.credentials;
      delete node.webhookId;
    }
  }
  return clone as T;
}

export function sha256Hex(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
