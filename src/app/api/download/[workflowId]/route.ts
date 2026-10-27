import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkEntitlement } from "@/lib/entitlements";
import { getClientIp } from "@/lib/hash";

export const runtime = "nodejs";

const SIGNED_URL_TTL_SECONDS = 60;

export async function GET(request: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const { entitled } = await checkEntitlement(supabase, user.id, workflowId);
  if (!entitled) {
    return NextResponse.json({ ok: false, error: "not-entitled" }, { status: 403 });
  }

  const service = createServiceClient();

  // 10 downloads/hour/user (Section 8.3) — a simple count-based check
  // against the `downloads` log table rather than a separate Redis
  // limiter, since this endpoint doesn't need sub-second precision.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await service
    .from("downloads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= 10) {
    return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });
  }

  const { data: latestVersion, error: versionError } = await service
    .from("workflow_versions")
    .select("version, storage_path")
    .eq("workflow_id", workflowId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (versionError || !latestVersion) {
    return NextResponse.json({ ok: false, error: "no-version-available" }, { status: 404 });
  }

  const { data: signed, error: signError } = await service.storage
    .from("workflow-json")
    .createSignedUrl(latestVersion.storage_path as string, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) {
    console.error("Failed to sign download URL:", signError);
    return NextResponse.json({ ok: false, error: "sign-failed" }, { status: 500 });
  }

  await service.from("downloads").insert({
    user_id: user.id,
    workflow_id: workflowId,
    version: latestVersion.version,
    ip: getClientIp(request.headers),
    user_agent: request.headers.get("user-agent"),
  });

  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}
