import { createBrowserClient } from "@supabase/ssr";

/**
 * Anon-key client for Client Components. Deliberately reads the two
 * NEXT_PUBLIC_ vars directly instead of importing `@/lib/env`: that module
 * validates *server* secrets too, which don't exist in the browser bundle,
 * so importing it from client code throws at runtime (Next inlines
 * NEXT_PUBLIC_* at build time, so these two are safe to read here).
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }
  return createBrowserClient(url, anonKey);
}
