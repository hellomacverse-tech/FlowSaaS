import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  // RLS (`n8n_instances_write_own`) already scopes this to the caller; the
  // explicit `.eq("user_id", ...)` just makes that intent visible in the code.
  const { error } = await supabase.from("n8n_instances").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ ok: false, error: "delete-failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
