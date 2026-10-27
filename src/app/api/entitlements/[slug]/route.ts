import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkEntitlement } from "@/lib/entitlements";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ owned: false, dbWorkflowId: null });
  }

  const { data: workflow } = await supabase.from("workflows").select("id").eq("slug", slug).maybeSingle();
  if (!workflow) {
    return NextResponse.json({ owned: false, dbWorkflowId: null });
  }

  const entitlement = await checkEntitlement(supabase, user.id, workflow.id as string);
  return NextResponse.json({ owned: entitlement.entitled, dbWorkflowId: workflow.id as string });
}
