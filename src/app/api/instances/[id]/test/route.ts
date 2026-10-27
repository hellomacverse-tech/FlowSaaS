import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertPublicUrl, SsrfError } from "@/lib/security/ssrf";
import { safeFetch } from "@/lib/security/safe-fetch";
import { decryptSecret } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/ratelimit";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/** Re-verifies a stored instance is still reachable, re-running the SSRF check on every call (Section 7.4: "re-resolve on connect"). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const limit = await checkRateLimit("instances", user.id);
  if (!limit.success) return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });

  const { data: instance } = await supabase
    .from("n8n_instances")
    .select("base_url, api_key_ciphertext, api_key_iv, api_key_tag")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!instance) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });

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

  try {
    const res = await safeFetch(new URL("/api/v1/workflows?limit=1", verifiedUrl).toString(), {
      headers: { "X-N8N-API-KEY": apiKey },
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: "verification-failed" }, { status: 422 });

    const n8nVersion = res.headers.get("x-n8n-version");
    await supabase.from("n8n_instances").update({ last_verified_at: new Date().toISOString(), n8n_version: n8nVersion }).eq("id", id);
    return NextResponse.json({ ok: true, n8nVersion });
  } catch {
    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 422 });
  }
}
