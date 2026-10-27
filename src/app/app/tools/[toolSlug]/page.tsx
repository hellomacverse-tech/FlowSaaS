import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getToolSeed } from "@/data/tools";
import { ToolRunner } from "@/components/dashboard/ToolRunner";

export const metadata = { robots: { index: false, follow: false } };

export default async function ToolRunPage({ params }: { params: Promise<{ toolSlug: string }> }) {
  const { toolSlug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/app/tools/${toolSlug}`);

  const tool = getToolSeed(toolSlug);
  if (!tool) notFound();

  return (
    <div>
      <h1 className="text-h3 text-ink">{tool.name}</h1>
      <p className="mt-1 text-sm text-ink-2">{tool.description}</p>
      <div className="mt-6">
        <ToolRunner tool={tool} />
      </div>
    </div>
  );
}
