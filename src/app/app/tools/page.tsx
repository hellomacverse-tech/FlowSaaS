import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toolSeeds } from "@/data/tools";

export const metadata = { robots: { index: false, follow: false } };

export default async function ToolsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/tools");

  return (
    <div>
      <h1 className="text-h3 text-ink">Active Automation Tools</h1>
      <p className="mt-1 text-sm text-ink-2">Run a workflow directly from your browser — no n8n needed.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {toolSeeds.map((tool) => (
          <Link key={tool.slug} href={`/app/tools/${tool.slug}`}>
            <Card interactive className="flex h-full flex-col p-5">
              <p className="text-sm font-semibold text-ink">{tool.name}</p>
              <p className="mt-1.5 flex-1 text-sm text-ink-2">{tool.description}</p>
              <Badge tone="teal" className="mt-3 w-fit">
                {tool.creditsPerRun} credit{tool.creditsPerRun === 1 ? "" : "s"}/run
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
