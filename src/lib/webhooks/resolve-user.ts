import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves the FlowSaaS user a Stripe event belongs to, in priority order:
 * 1. `client_reference_id` set at Checkout time (the buyer was signed in)
 * 2. An existing profile with a matching email (same person, different session)
 * 3. A brand-new auth user created from the Checkout email — the profile
 *    row (with a generated license key) appears automatically via the
 *    `handle_new_auth_user` trigger from migration 0001. `email_confirm:
 *    true` is safe here because Stripe already verified the address well
 *    enough to send a receipt to it.
 *
 * Returns the resolved user id, or null if there's no email to work with
 * at all (shouldn't happen — Checkout always collects one).
 */
export async function resolveUserForCheckout(
  service: SupabaseClient,
  params: { clientReferenceId?: string | null; email?: string | null },
): Promise<string | null> {
  if (params.clientReferenceId) {
    return params.clientReferenceId;
  }

  if (!params.email) {
    return null;
  }

  const { data: existing } = await service
    .from("profiles")
    .select("id")
    .eq("email", params.email)
    .maybeSingle();

  if (existing) {
    return existing.id as string;
  }

  const { data: created, error } = await service.auth.admin.createUser({
    email: params.email,
    email_confirm: true,
  });

  if (error || !created.user) {
    console.error("Failed to create user for anonymous checkout:", error);
    return null;
  }

  return created.user.id;
}
