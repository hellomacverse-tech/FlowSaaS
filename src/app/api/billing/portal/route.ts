import { NextResponse } from "next/server";
import { paymentProvider } from "@/lib/payments/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ ok: false, error: "no-billing-account" }, { status: 400 });
  }

  const { url } = await paymentProvider.createBillingPortalSession({
    customerId: profile.stripe_customer_id as string,
    returnUrl: `${siteConfig.url}/app/billing`,
  });

  return NextResponse.json({ ok: true, url });
}
