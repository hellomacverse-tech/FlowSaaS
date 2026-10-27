import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseBearerKey, hashApiKey } from "@/lib/api-keys";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type AuthContext = { userId: string; source: "dashboard" } | { userId: string; source: "api"; apiKeyId: string };

/**
 * `POST /api/tools/{slug}/run` (session cookie) and `POST /api/v1/run`
 * (Bearer key) share `runTool()`, so they share this too: resolve to a
 * userId + which surface called it, or null. A revoked or unknown key
 * authenticates to nothing (null), same as no cookie.
 */
export async function resolveApiAuth(request: Request): Promise<AuthContext | null> {
  const bearer = parseBearerKey(request.headers.get("authorization"));
  if (bearer) {
    const service = createServiceClient();
    const hash = hashApiKey(bearer);
    const { data } = await service.from("api_keys").select("id, user_id, revoked_at").eq("key_hash", hash).maybeSingle();
    if (!data || data.revoked_at) return null;
    await service.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id as string);
    return { userId: data.user_id as string, source: "api", apiKeyId: data.id as string };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { userId: user.id, source: "dashboard" } : null;
}

export async function getUserTier(service: SupabaseClient, userId: string): Promise<"free" | "vip" | "enterprise"> {
  const { data } = await service.from("profiles").select("tier").eq("id", userId).maybeSingle();
  return (data?.tier as "free" | "vip" | "enterprise" | undefined) ?? "free";
}
