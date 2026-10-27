import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";
import type {
  PaymentProvider,
  CreateWorkflowCheckoutInput,
  CreateVipCheckoutInput,
  CheckoutSessionResult,
  BillingPortalInput,
} from "./types";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-08-26.dahlia",
});

/**
 * One-time workflow prices use Stripe's ad-hoc `price_data` rather than a
 * pre-created Price object per workflow. The spec (Section 8.2) describes
 * Prices "created from workflows.price_cents by an admin script" — that's
 * the right call once there's a real Stripe account and an admin panel to
 * run it from, but `price_data` is the standard, equally-correct Stripe
 * pattern for one-time purchases and needs no out-of-band sync step
 * between the `workflows` table and Stripe. VIP subscriptions still use
 * real pre-created Price IDs (`STRIPE_PRICE_VIP_MONTHLY`/`_ANNUAL`) since
 * a recurring price benefits from being a stable, reusable object.
 */
class StripePaymentProvider implements PaymentProvider {
  async createWorkflowCheckout(input: CreateWorkflowCheckoutInput): Promise<CheckoutSessionResult> {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: input.currency,
            unit_amount: input.priceCents,
            product_data: { name: input.workflowTitle },
          },
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      ...(input.userId ? { client_reference_id: input.userId } : {}),
      ...(!input.userId && input.userEmail ? { customer_email: input.userEmail } : {}),
      metadata: { workflowId: input.workflowId, kind: "workflow" },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { url: session.url, sessionId: session.id };
  }

  async createVipCheckout(input: CreateVipCheckoutInput): Promise<CheckoutSessionResult> {
    const priceId = input.interval === "year" ? env.STRIPE_PRICE_VIP_ANNUAL : env.STRIPE_PRICE_VIP_MONTHLY;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      ...(input.userId ? { client_reference_id: input.userId } : {}),
      ...(!input.userId && input.userEmail ? { customer_email: input.userEmail } : {}),
      metadata: { kind: "vip", interval: input.interval },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { url: session.url, sessionId: session.id };
  }

  async createBillingPortalSession(input: BillingPortalInput): Promise<{ url: string }> {
    const session = await stripe.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
    });
    return { url: session.url };
  }
}

export const paymentProvider: PaymentProvider = new StripePaymentProvider();
