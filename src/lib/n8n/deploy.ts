import { sanitizeWorkflow, validateWorkflow, MAX_WORKFLOW_BYTES } from "./validate";

export class DeployPrepError extends Error {
  constructor(public errors: string[]) {
    super(`Workflow failed validation: ${errors.join("; ")}`);
    this.name = "DeployPrepError";
  }
}

/**
 * Re-validates the entitled workflow JSON immediately before it's POSTed to a
 * customer's instance (Section 7.4). Belt and braces: the file was validated
 * at generation and at upload, but this is the last gate before it touches
 * infrastructure we don't own, so it runs again on the bytes actually read
 * from storage. Sets the name, forces `active:false` (the customer must
 * connect credentials before anything runs), and strips instance ids/pinData.
 */
export function prepareForDeploy(raw: string, meta: { title: string; version: string }) {
  const bytes = Buffer.byteLength(raw);
  if (bytes > MAX_WORKFLOW_BYTES) throw new DeployPrepError([`Workflow is ${bytes} bytes, over the limit.`]);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new DeployPrepError(["Workflow file is not valid JSON."]);
  }

  // pinData / credentials / instanceId are STRIPPED (they'd otherwise fail
  // validation), then the cleaned document must pass the allowlist.
  const cleaned = sanitizeWorkflow(parsed as Record<string, unknown>);
  const result = validateWorkflow(cleaned, bytes);
  if (!result.ok) throw new DeployPrepError(result.errors);

  return { ...cleaned, name: `${meta.title} (FlowSaaS v${meta.version})`, active: false };
}

/** Distinct credentials the customer must connect after import (from the workflow's node docs). */
export function credentialChecklist(nodes: { credentialsNeeded: string | null }[]): string[] {
  return Array.from(new Set(nodes.map((n) => n.credentialsNeeded).filter((c): c is string => Boolean(c))));
}
