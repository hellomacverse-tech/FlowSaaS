import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkEntitlement } from "@/lib/entitlements";
import { createImportToken } from "@/lib/import-token";
import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";

export const runtime = "nodejs";
const bodySchema = z.object({ workflowId: z.string().uuid() });

/**
 * "Copy import URL" tab (Section 7.4): a 10-minute signed link n8n's
 * "Import from URL" feature can fetch directly — no n8n-side auth needed,
 * because the token itself carries and proves the grant.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation-failed" }, { status: 422 });

  const entitlement = await checkEntitlement(supabase, user.id, parsed.data.workflowId);
  if (!entitlement.entitled) return NextResponse.json({ ok: false, error: "not-entitled" }, { status: 403 });

  const token = createImportToken(env.N8N_WEBHOOK_SIGNING_SECRET, parsed.data.workflowId, user.id);
  return NextResponse.json({ ok: true, url: `${siteConfig.url}/api/import/${token}`, expiresInSeconds: 600 });
}
