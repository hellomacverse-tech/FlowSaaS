import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role client: bypasses Row Level Security entirely. Only ever
 * used from route handlers and webhooks (Section 5: "writes via service
 * role"), never from a Server Component that renders user-controllable
 * data, and never imported into anything that could end up in a client
 * bundle — the `server-only` import above makes that a build error if it
 * happens by accident.
 */
export function createServiceClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
