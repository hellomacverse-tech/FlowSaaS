export interface CreateWorkflowCheckoutInput {
  workflowId: string;
  workflowTitle: string;
  priceCents: number;
  currency: string;
  userId?: string | undefined;
  userEmail?: string | undefined;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateVipCheckoutInput {
  interval: "month" | "year";
  userId?: string | undefined;
  userEmail?: string | undefined;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

export interface BillingPortalInput {
  customerId: string;
  returnUrl: string;
}

/**
 * Every payment operation FlowSaaS needs, independent of which processor
 * is behind it. Route handlers call this interface, never the Stripe SDK
 * directly (Section 2.1: "behind a PaymentProvider interface"), so
 * switching to a merchant-of-record provider for global VAT handling is a
 * new adapter, not a rewrite of every checkout call site.
 */
export interface PaymentProvider {
  createWorkflowCheckout(input: CreateWorkflowCheckoutInput): Promise<CheckoutSessionResult>;
  createVipCheckout(input: CreateVipCheckoutInput): Promise<CheckoutSessionResult>;
  createBillingPortalSession(input: BillingPortalInput): Promise<{ url: string }>;
}
