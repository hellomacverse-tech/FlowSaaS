import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiKeysManager } from "@/components/dashboard/ApiKeysManager";

export const metadata = { robots: { index: false, follow: false } };

export default async function ApiKeysPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/api-keys");

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, prefix, last_used_at, revoked_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-h3 text-ink">API keys</h1>
      <p className="mt-1 text-sm text-ink-2">
        Use a key to call <code className="rounded bg-surface px-1.5 py-0.5 text-xs">POST /api/v1/run</code> from your own code. Max 10 active keys.
      </p>
      <div className="mt-6">
        <ApiKeysManager initialKeys={keys ?? []} />
      </div>
    </div>
  );
}
