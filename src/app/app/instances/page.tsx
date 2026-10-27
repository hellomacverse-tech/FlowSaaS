import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { InstanceManager } from "@/components/dashboard/InstanceManager";

export const metadata = { robots: { index: false, follow: false } };

export default async function InstancesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/instances");

  const { data: instances } = await supabase
    .from("n8n_instances")
    .select("id, label, base_url, last_verified_at, n8n_version")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-h3 text-ink">n8n instances</h1>
      <p className="mt-1 text-sm text-ink-2">Connect your own n8n instance to deploy workflows directly from a product page.</p>
      <div className="mt-6">
        <InstanceManager initialInstances={instances ?? []} />
      </div>
    </div>
  );
}
