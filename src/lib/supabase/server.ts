import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Anon-key client bound to the current request's session cookie, so every
 * query runs as the signed-in user and RLS applies normally. Use this (not
 * `lib/supabase/service.ts`) anywhere you want "what can this specific
 * user see" rather than admin access.
 *
 * `setAll` is wrapped in a try/catch because Server Components can't set
 * cookies — only Server Actions and Route Handlers can. When called from a
 * Server Component this silently no-ops, which is fine as long as
 * `middleware.ts` is refreshing the session on every request (it is).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — middleware handles refresh instead.
        }
      },
    },
  });
}
