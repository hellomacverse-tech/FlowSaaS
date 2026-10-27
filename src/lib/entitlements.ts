import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface EntitlementCheck {
  entitled: boolean;
  source: "purchase" | "vip" | "dfy" | "admin" | null;
}

/**
 * A user is entitled to a workflow if they have a row in `entitlements`
 * for that specific `workflow_id`, OR a row with `workflow_id IS NULL`
 * (the all-access grant VIP subscribers and DFY clients receive) whose
 * `expires_at` (if any) hasn't passed. This mirrors the DB comment in
 * Section 5 verbatim: "single source of truth for 'can this user download
 * X'." Pass a client scoped to the user's own session (or the service
 * client from a webhook/route handler) — this function itself doesn't
 * care which, it just runs the query.
 */
export async function checkEntitlement(
  supabase: SupabaseClient,
  userId: string,
  workflowId: string,
): Promise<EntitlementCheck> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("entitlements")
    .select("source, workflow_id, expires_at")
    .eq("user_id", userId)
    .or(`workflow_id.eq.${workflowId},workflow_id.is.null`)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

  if (error) {
    console.error("Entitlement check failed:", error);
    return { entitled: false, source: null };
  }

  const rows = data ?? [];
  // Prefer a workflow-specific entitlement's source when both a specific
  // purchase and an all-access grant exist, since it's the more precise answer.
  const specific = rows.find((r) => r.workflow_id === workflowId);
  const allAccess = rows.find((r) => r.workflow_id === null);
  const match = specific ?? allAccess;

  return match ? { entitled: true, source: match.source as EntitlementCheck["source"] } : { entitled: false, source: null };
}
