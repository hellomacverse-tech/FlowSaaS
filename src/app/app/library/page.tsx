import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata = { robots: { index: false, follow: false } };

export default async function LibraryPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/library");

  const { data: profile } = await supabase.from("profiles").select("license_key, tier").eq("id", user.id).single();

  const { data: entitlements } = await supabase
    .from("entitlements")
    .select("workflow_id, source, workflows ( id, title, slug, current_version )")
    .eq("user_id", user.id);

  interface EntitledWorkflow {
    id: string;
    title: string;
    slug: string;
    current_version: string;
  }

  const hasAllAccess = (entitlements ?? []).some((e) => e.workflow_id === null);
  const specificWorkflows: EntitledWorkflow[] = (entitlements ?? [])
    .filter((e) => e.workflow_id !== null)
    .flatMap((e) => (Array.isArray(e.workflows) ? e.workflows : e.workflows ? [e.workflows] : []))
    .filter((w): w is EntitledWorkflow => Boolean(w));

  return (
    <div>
      <h1 className="text-h3 text-ink">Your library</h1>

      {profile?.license_key ? (
        <Card className="mt-4 flex items-center justify-between p-4">
          <div>
            <p className="text-xs text-muted">License key</p>
            <p className="font-mono text-sm text-ink">{profile.license_key}</p>
          </div>
          <Badge tone={profile.tier === "vip" ? "violet" : "slate"} className="capitalize">
            {profile.tier ?? "free"}
          </Badge>
        </Card>
      ) : null}

      {hasAllAccess ? (
        <Card className="mt-4 p-4 text-sm text-ink-2">
          Your VIP Pass includes every workflow in the catalog —{" "}
          <Link href="/workflows" className="text-violet-600 hover:underline">
            browse the full catalog
          </Link>{" "}
          and download any of them directly from its product page.
        </Card>
      ) : null}

      {specificWorkflows.length === 0 && !hasAllAccess ? (
        <Card className="mt-4 p-8 text-center">
          <p className="text-sm text-ink-2">
            No workflows yet.{" "}
            <Link href="/workflows" className="text-violet-600 hover:underline">
              Browse the catalog
            </Link>{" "}
            to get started.
          </p>
        </Card>
      ) : null}

      {specificWorkflows.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          {specificWorkflows.map((workflow) => (
            <Card key={workflow.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-ink">{workflow.title}</p>
                <p className="text-xs text-muted">v{workflow.current_version}</p>
              </div>
              <Button asChild size="sm">
                <a href={`/api/download/${workflow.id}`}>Download</a>
              </Button>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
