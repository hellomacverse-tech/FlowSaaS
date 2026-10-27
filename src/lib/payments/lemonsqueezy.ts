import type {
  PaymentProvider,
  CreateWorkflowCheckoutInput,
  CreateVipCheckoutInput,
  CheckoutSessionResult,
  BillingPortalInput,
} from "./types";

/**
 * Stubbed merchant-of-record adapter for global VAT handling (Section
 * 2.1). Not wired into any route yet — `payments/stripe.ts` is what
 * `api/checkout` actually calls. This exists so the day FlowSaaS needs a
 * merchant of record, the interface it must satisfy is already defined and
 * every call site already goes through `PaymentProvider`, not the Stripe
 * SDK directly.
 */
class LemonSqueezyPaymentProvider implements PaymentProvider {
  async createWorkflowCheckout(_input: CreateWorkflowCheckoutInput): Promise<CheckoutSessionResult> {
    throw new Error(
      "LemonSqueezy adapter is not implemented yet. Set PAYMENT_PROVIDER=stripe or implement this adapter against the LemonSqueezy Checkouts API.",
    );
  }

  async createVipCheckout(_input: CreateVipCheckoutInput): Promise<CheckoutSessionResult> {
    throw new Error("LemonSqueezy adapter is not implemented yet.");
  }

  async createBillingPortalSession(_input: BillingPortalInput): Promise<{ url: string }> {
    throw new Error("LemonSqueezy adapter is not implemented yet.");
  }
}

export const lemonSqueezyPaymentProvider: PaymentProvider = new LemonSqueezyPaymentProvider();
