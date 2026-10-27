import { NextResponse } from "next/server";
import { verifyImportToken } from "@/lib/import-token";
import { createServiceClient } from "@/lib/supabase/service";
import { checkEntitlement } from "@/lib/entitlements";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * What n8n's "Import from URL" actually fetches — no cookies, no headers it
 * would think to send, so the token in the path IS the auth (verified,
 * time-limited). Entitlement is re-checked at use-time (not just at
 * mint-time): a refund between minting and use must still block the file.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const claim = verifyImportToken(env.N8N_WEBHOOK_SIGNING_SECRET, token);
  if (!claim) return NextResponse.json({ ok: false, error: "invalid-or-expired-token" }, { status: 401 });

  const service = createServiceClient();
  const entitlement = await checkEntitlement(service, claim.userId, claim.workflowId);
  if (!entitlement.entitled) return NextResponse.json({ ok: false, error: "not-entitled" }, { status: 403 });

  const { data: version } = await service
    .from("workflow_versions")
    .select("storage_path")
    .eq("workflow_id", claim.workflowId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!version) return NextResponse.json({ ok: false, error: "no-version-available" }, { status: 404 });

  const { data: file, error } = await service.storage.from("workflow-json").download(version.storage_path as string);
  if (error || !file) return NextResponse.json({ ok: false, error: "file-not-found" }, { status: 404 });

  return new NextResponse(await file.text(), { headers: { "Content-Type": "application/json" } });
}
