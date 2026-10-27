import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/** Regenerates the caller's license key (Section 9.5: "Regenerate ... warns that old key stops working"). */
export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const service = createServiceClient();
  const { data: generated, error: genError } = await service.rpc("generate_license_key").single<string>();
  if (genError || !generated) {
    console.error("Failed to generate license key:", genError);
    return NextResponse.json({ ok: false, error: "generate-failed" }, { status: 500 });
  }

  const { error } = await service.from("profiles").update({ license_key: generated }).eq("id", user.id);
  if (error) return NextResponse.json({ ok: false, error: "update-failed" }, { status: 500 });

  await service.from("audit_log").insert({ actor: user.id, action: "license.regenerate", entity: "profiles", entity_id: user.id });

  return NextResponse.json({ ok: true, licenseKey: generated });
}
