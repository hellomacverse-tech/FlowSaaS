import { NextResponse } from "next/server";
import { checkoutRequestSchema } from "@/lib/schema/checkout";
import { paymentProvider } from "@/lib/payments/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { siteConfig } from "@/config/site";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation-failed" }, { status: 422 });
  }

  // Checkout works for both signed-in users (client_reference_id links the
  // session back to their profile in the webhook) and anonymous buyers
  // (Section 8.2: "Unauthenticated buyers are asked for email in Checkout
  // and their account is created/linked on webhook").
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    if (parsed.data.kind === "vip") {
      const result = await paymentProvider.createVipCheckout({
        interval: parsed.data.interval,
        userId: user?.id,
        userEmail: user?.email,
        successUrl: `${siteConfig.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${siteConfig.url}/pricing#vip`,
      });
      return NextResponse.json({ ok: true, url: result.url });
    }

    const service = createServiceClient();
    const { data: workflow, error } = await service
      .from("workflows")
      .select("id, slug, title, price_cents, currency, status")
      .eq("slug", parsed.data.slug)
      .single();

    if (error || !workflow || workflow.status !== "published") {
      return NextResponse.json({ ok: false, error: "workflow-not-found" }, { status: 404 });
    }

    const result = await paymentProvider.createWorkflowCheckout({
      workflowId: workflow.id as string,
      workflowTitle: workflow.title as string,
      priceCents: workflow.price_cents as number,
      currency: (workflow.currency as string) ?? "usd",
      userId: user?.id,
      userEmail: user?.email,
      successUrl: `${siteConfig.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${siteConfig.url}/workflows/${workflow.slug}`,
    });
    return NextResponse.json({ ok: true, url: result.url });
  } catch (err) {
    console.error("Checkout session creation failed:", err);
    return NextResponse.json({ ok: false, error: "checkout-failed" }, { status: 500 });
  }
}
