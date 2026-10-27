import { NextResponse } from "next/server";
import { deployRequestSchema } from "@/lib/schema/deploy";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkEntitlement } from "@/lib/entitlements";
import { prepareForDeploy, credentialChecklist, DeployPrepError } from "@/lib/n8n/deploy";
import { assertPublicUrl, SsrfError } from "@/lib/security/ssrf";
import { safeFetch } from "@/lib/security/safe-fetch";
import { decryptSecret } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/ratelimit";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * "Deploy to My n8n Instance" (Section 7.4): entitlement gate → fetch the
 * entitled JSON → re-validate + rename + force-inactive
 * (`prepareForDeploy`) → re-resolve the stored instance URL (SSRF guard,
 * again, at the moment we're about to use it — a URL that was safe when
 * connected could have been repointed since) → `safeFetch` POST with the
 * decrypted key → audit log.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const limit = await checkRateLimit("deploy", user.id);
  if (!limit.success) return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  const parsed = deployRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation-failed" }, { status: 422 });
  const { workflowId, instanceId } = parsed.data;

  const entitlement = await checkEntitlement(supabase, user.id, workflowId);
  if (!entitlement.entitled) return NextResponse.json({ ok: false, error: "not-entitled" }, { status: 403 });

  const service = createServiceClient();

  const { data: instance } = await supabase
    .from("n8n_instances")
    .select("base_url, api_key_ciphertext, api_key_iv, api_key_tag")
    .eq("id", instanceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!instance) return NextResponse.json({ ok: false, error: "instance-not-found" }, { status: 404 });

  const { data: workflow } = await service.from("workflows").select("title, current_version").eq("id", workflowId).maybeSingle();
  const { data: version } = await service
    .from("workflow_versions")
    .select("storage_path")
    .eq("workflow_id", workflowId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: nodeDocs } = await service.from("workflow_nodes_doc").select("credentials_needed").eq("workflow_id", workflowId);

  if (!workflow || !version) return NextResponse.json({ ok: false, error: "workflow-not-found" }, { status: 404 });

  const { data: file, error: downloadError } = await service.storage.from("workflow-json").download(version.storage_path as string);
  if (downloadError || !file) return NextResponse.json({ ok: false, error: "file-not-found" }, { status: 404 });

  let prepared: Record<string, unknown>;
  try {
    prepared = prepareForDeploy(await file.text(), { title: workflow.title as string, version: workflow.current_version as string });
  } catch (err) {
    const errors = err instanceof DeployPrepError ? err.errors : ["Unexpected validation failure."];
    console.error("Deploy prep failed:", errors);
    return NextResponse.json({ ok: false, error: "invalid-workflow-file", details: errors }, { status: 500 });
  }

  let verifiedUrl: URL;
  try {
    verifiedUrl = await assertPublicUrl(instance.base_url as string);
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof SsrfError ? err.message : "invalid-url" }, { status: 422 });
  }

  const apiKey = decryptSecret(
    { ciphertext: instance.api_key_ciphertext as string, iv: instance.api_key_iv as string, tag: instance.api_key_tag as string },
    env.ENCRYPTION_KEY_BASE64,
  );

  let created: { id?: string } = {};
  try {
    const res = await safeFetch(new URL("/api/v1/workflows", verifiedUrl).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-N8N-API-KEY": apiKey },
      body: JSON.stringify(prepared),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "deploy-rejected", status: res.status }, { status: 502 });
    }
    created = (await res.json().catch(() => ({}))) as { id?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "deploy-failed" }, { status: 502 });
  }

  await service.from("audit_log").insert({ actor: user.id, action: "deploy", entity: "n8n_instances", entity_id: instanceId, meta: { workflowId, remoteWorkflowId: created.id } });

  return NextResponse.json({
    ok: true,
    remoteWorkflowId: created.id ?? null,
    remoteUrl: created.id ? new URL(`/workflow/${created.id}`, verifiedUrl).toString() : null,
    credentialsNeeded: credentialChecklist((nodeDocs ?? []).map((n) => ({ credentialsNeeded: n.credentials_needed as string | null }))),
  });
}
