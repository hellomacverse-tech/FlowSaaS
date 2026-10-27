import { NextResponse } from "next/server";
import { connectInstanceSchema } from "@/lib/schema/instances";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertPublicUrl, SsrfError } from "@/lib/security/ssrf";
import { safeFetch } from "@/lib/security/safe-fetch";
import { encryptSecret, maskSecret } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/ratelimit";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/** GET: list the caller's instances, keys masked — the plaintext key never round-trips to the browser again after creation. */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const { data } = await supabase
    .from("n8n_instances")
    .select("id, label, base_url, last_verified_at, n8n_version, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ ok: true, instances: data ?? [] });
}

/**
 * POST: connect an instance (Section 7.4). The URL is validated for SSRF
 * (HTTPS, DNS re-resolved, private ranges rejected) BEFORE it's ever fetched,
 * verified live with `GET {base}/api/v1/workflows?limit=1`, and only then is
 * the API key encrypted (AES-256-GCM) and stored — a URL that fails
 * verification never gets a key written for it.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const limit = await checkRateLimit("instances", user.id);
  if (!limit.success) return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  const parsed = connectInstanceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation-failed" }, { status: 422 });

  let verifiedUrl: URL;
  try {
    verifiedUrl = await assertPublicUrl(parsed.data.baseUrl);
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof SsrfError ? err.message : "invalid-url" }, { status: 422 });
  }

  let n8nVersion: string | null = null;
  try {
    // `safeFetch`, not a raw fetch: `assertPublicUrl` above is a pre-flight
    // check, which alone is vulnerable to DNS rebinding (the name resolves
    // public for the check, then private by the time the connection is
    // actually opened). `safeFetch` re-validates the address the socket
    // connects to, closing that gap (Section 7.4: "re-resolve on connect").
    const res = await safeFetch(new URL("/api/v1/workflows?limit=1", verifiedUrl).toString(), {
      headers: { "X-N8N-API-KEY": parsed.data.apiKey },
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "verification-failed" }, { status: 422 });
    }
    n8nVersion = res.headers.get("x-n8n-version");
  } catch {
    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 422 });
  }

  const encrypted = encryptSecret(parsed.data.apiKey, env.ENCRYPTION_KEY_BASE64);
  const { data: instance, error } = await supabase
    .from("n8n_instances")
    .insert({
      user_id: user.id,
      label: parsed.data.label,
      base_url: verifiedUrl.toString(),
      api_key_ciphertext: encrypted.ciphertext,
      api_key_iv: encrypted.iv,
      api_key_tag: encrypted.tag,
      key_id: encrypted.keyId,
      last_verified_at: new Date().toISOString(),
      n8n_version: n8nVersion,
    })
    .select("id, label, base_url, last_verified_at, n8n_version")
    .single();

  if (error || !instance) {
    console.error("Failed to store n8n instance:", error);
    return NextResponse.json({ ok: false, error: "insert-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, instance: { ...instance, apiKeyMasked: maskSecret(parsed.data.apiKey) } });
}
