import { NextResponse } from "next/server";
import { createApiKeySchema } from "@/lib/schema/instances";
import { generateApiKey, MAX_ACTIVE_KEYS } from "@/lib/api-keys";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const { data } = await supabase
    .from("api_keys")
    .select("id, name, prefix, scopes, last_used_at, revoked_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ ok: true, keys: data ?? [] });
}

/** The full key is returned exactly once, here — every other read (GET above) sees only `prefix`. */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  const parsed = createApiKeySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation-failed" }, { status: 422 });

  const { count } = await supabase.from("api_keys").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("revoked_at", null);
  if ((count ?? 0) >= MAX_ACTIVE_KEYS) {
    return NextResponse.json({ ok: false, error: "max-keys-reached" }, { status: 422 });
  }

  const generated = generateApiKey();
  const { data: row, error } = await supabase
    .from("api_keys")
    .insert({ user_id: user.id, name: parsed.data.name, prefix: generated.prefix, key_hash: generated.hash })
    .select("id, name, prefix, created_at")
    .single();

  if (error || !row) return NextResponse.json({ ok: false, error: "insert-failed" }, { status: 500 });

  return NextResponse.json({ ok: true, key: generated.key, record: row });
}
