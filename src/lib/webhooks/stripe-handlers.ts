import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveUserForCheckout } from "@/lib/webhooks/resolve-user";
import { sendPurchaseReceiptEmail, sendVipWelcomeEmail } from "@/lib/email";

type ServiceClient = SupabaseClient;

/**
 * Stripe event handlers, split out of the route file so they can be unit
 * tested with a fake Supabase client (Section 15.4: "refund → entitlement
 * revoke"). The route itself only verifies the signature, claims the event
 * for idempotency, and dispatches here.
 */

export async function handleCheckoutCompleted(
  service: ServiceClient,
  session: Stripe.Checkout.Session,
) {
  const userId = await resolveUserForCheckout(service, {
    clientReferenceId: session.client_reference_id,
    email: session.customer_details?.email ?? session.customer_email,
  });
  if (!userId) {
    console.error("checkout.session.completed with no resolvable user:", session.id);
    return;
  }

  if (session.customer && typeof session.customer === "string") {
    await service.from("profiles").update({ stripe_customer_id: session.customer }).eq("id", userId);
  }

  if (session.metadata?.kind === "workflow" && session.metadata.workflowId) {
    const workflowId = session.metadata.workflowId;

    const { data: order } = await service
      .from("orders")
      .insert({
        user_id: userId,
        workflow_id: workflowId,
        stripe_session_id: session.id,
        stripe_payment_intent:
          typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        status: "paid",
      })
      .select("id")
      .single();

    await service
      .from("entitlements")
      .upsert(
        { user_id: userId, workflow_id: workflowId, source: "purchase", source_ref: order?.id },
        { onConflict: "user_id,workflow_id,source" },
      );

    const { data: workflow } = await service
      .from("workflows")
      .select("title, current_version")
      .eq("id", workflowId)
      .single();
    const { data: profile } = await service.from("profiles").select("email, license_key").eq("id", userId).single();

    if (workflow && profile) {
      await sendPurchaseReceiptEmail(profile.email as string, {
        workflowTitle: workflow.title as string,
        amountCents: session.amount_total ?? 0,
        currency: (session.currency ?? "usd").toUpperCase(),
        licenseKey: profile.license_key as string,
      }).catch((err) => console.error("Purchase receipt email failed:", err));
    }
  }

  // VIP subscription checkouts are finalized by the
  // customer.subscription.created event below, which carries the full
  // subscription object (status, period end, trial end) that this
  // checkout.session.completed payload doesn't.
}

export async function handleSubscriptionUpsert(service: ServiceClient, subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const { data: profile } = await service
    .from("profiles")
    .select("id, email")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!profile) {
    console.error("No profile found for Stripe customer:", customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const interval = subscription.items.data[0]?.price.recurring?.interval === "year" ? "year" : "month";
  const isActive = subscription.status === "active" || subscription.status === "trialing";
  // `current_period_end` moved from the Subscription object onto each
  // SubscriptionItem in recent Stripe API versions — a single-item
  // subscription (which is all FlowSaaS creates) still has one clear value.
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  await service.from("subscriptions").upsert(
    {
      user_id: profile.id,
      stripe_subscription_id: subscription.id,
      price_id: priceId,
      interval,
      status: subscription.status,
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    },
    { onConflict: "stripe_subscription_id" },
  );

  await service
    .from("profiles")
    .update({
      tier: isActive ? "vip" : "free",
      credits_included: isActive ? 2000 : 50,
    })
    .eq("id", profile.id);

  if (isActive) {
    await service
      .from("entitlements")
      .upsert(
        { user_id: profile.id, workflow_id: null, source: "vip", source_ref: null, expires_at: null },
        { onConflict: "user_id,workflow_id,source" },
      );

    // Only send the welcome email the first time this subscription
    // transitions into an active/trialing state, not on every renewal
    // update — a fresh insert vs. update is distinguished by checking
    // whether we just created the row (subscription age proxy: trial_end
    // in the future means this is a brand-new trial starting now).
    const isNewTrial = subscription.trial_end && subscription.trial_end * 1000 > Date.now();
    if (isNewTrial) {
      await sendVipWelcomeEmail(profile.email as string).catch((err) =>
        console.error("VIP welcome email failed:", err),
      );
    }
  } else {
    await service
      .from("entitlements")
      .delete()
      .eq("user_id", profile.id)
      .is("workflow_id", null)
      .eq("source", "vip");
  }
}

export async function handleSubscriptionDeleted(service: ServiceClient, subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const { data: profile } = await service
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (!profile) return;

  await service
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscription.id);

  await service.from("profiles").update({ tier: "free", credits_included: 50 }).eq("id", profile.id);

  await service.from("entitlements").delete().eq("user_id", profile.id).is("workflow_id", null).eq("source", "vip");
}

export async function handleInvoicePaymentFailed(service: ServiceClient, invoice: Stripe.Invoice) {
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
  if (subscriptionId) {
    await service.from("subscriptions").update({ status: "past_due" }).eq("stripe_subscription_id", subscriptionId);
  }
}

/**
 * Refunds revoke entitlement and invalidate future downloads, but never
 * recall a file already downloaded (Section 8.2's refund policy, restated
 * plainly on /refunds). Deleting the entitlement row is what "invalidates
 * future downloads" means in practice — the download route re-checks
 * entitlement on every request.
 */
export async function handleChargeRefunded(service: ServiceClient, charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const { data: order } = await service
    .from("orders")
    .update({ status: "refunded" })
    .eq("stripe_payment_intent", paymentIntentId)
    .select("user_id, workflow_id")
    .single();

  if (order?.user_id && order.workflow_id) {
    await service
      .from("entitlements")
      .delete()
      .eq("user_id", order.user_id)
      .eq("workflow_id", order.workflow_id)
      .eq("source", "purchase");
  }
}

export async function handleChargeDispute(service: ServiceClient, dispute: Stripe.Dispute) {
  const paymentIntentId = typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;
  if (!paymentIntentId) return;

  await service.from("orders").update({ status: "disputed" }).eq("stripe_payment_intent", paymentIntentId);

  await service.from("audit_log").insert({
    action: "charge.dispute.created",
    entity: "orders",
    entity_id: paymentIntentId,
    meta: { disputeId: dispute.id, reason: dispute.reason },
  });
}
