import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/payments/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { env } from "@/lib/env";
import {
  handleCheckoutCompleted,
  handleSubscriptionUpsert,
  handleSubscriptionDeleted,
  handleInvoicePaymentFailed,
  handleChargeRefunded,
  handleChargeDispute,
} from "@/lib/webhooks/stripe-handlers";

export const runtime = "nodejs";

/**
 * Marks an event processed exactly once. Insert fails on a duplicate
 * `event.id` (primary key), which is how we detect "already handled" —
 * Stripe redelivers events on any non-2xx response or timeout, so this is
 * the difference between granting an entitlement once and granting it
 * every time Stripe retries.
 */
async function claimEvent(service: ReturnType<typeof createServiceClient>, event: Stripe.Event): Promise<boolean> {
  const { error } = await service.from("stripe_events").insert({ id: event.id, type: event.type });
  return !error;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "missing-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "invalid-signature" }, { status: 400 });
  }

  const service = createServiceClient();

  const isNewEvent = await claimEvent(service, event);
  if (!isNewEvent) {
    return NextResponse.json({ received: true, deduped: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(service, event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(service, event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(service, event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(service, event.data.object as Stripe.Invoice);
        break;
      case "charge.refunded":
        await handleChargeRefunded(service, event.data.object as Stripe.Charge);
        break;
      case "charge.dispute.created":
        await handleChargeDispute(service, event.data.object as Stripe.Dispute);
        break;
      default:
        // Unhandled event types are acknowledged (200) but ignored, so
        // Stripe doesn't keep retrying something we intentionally skip.
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook handler failed for ${event.type}:`, err);
    // Let Stripe retry: remove the idempotency claim so a transient DB
    // error doesn't permanently swallow the event.
    await service.from("stripe_events").delete().eq("id", event.id);
    return NextResponse.json({ error: "handler-failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
