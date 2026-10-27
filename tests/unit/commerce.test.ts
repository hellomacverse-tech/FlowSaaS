import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkEntitlement } from "@/lib/entitlements";
import { handleChargeRefunded } from "@/lib/webhooks/stripe-handlers";
import { resolveUserForCheckout } from "@/lib/webhooks/resolve-user";
import { checkoutRequestSchema } from "@/lib/schema/checkout";
import { lemonSqueezyPaymentProvider } from "@/lib/payments/lemonsqueezy";

vi.mock("@/lib/email", () => ({
  sendPurchaseReceiptEmail: vi.fn(),
  sendVipWelcomeEmail: vi.fn(),
}));

/** Minimal chainable fake of the Supabase query builder, resolving to `result` when awaited. */
function fakeQuery(result: unknown) {
  const chain: Record<string, unknown> = {};
  const self = new Proxy(chain, {
    get(_t, prop) {
      if (prop === "then") return (resolve: (v: unknown) => unknown) => resolve(result);
      return () => self;
    },
  });
  return self;
}

describe("checkEntitlement", () => {
  const client = (rows: unknown[]) =>
    ({ from: () => fakeQuery({ data: rows, error: null }) }) as unknown as SupabaseClient;

  it("is not entitled with no rows", async () => {
    expect(await checkEntitlement(client([]), "u1", "w1")).toEqual({ entitled: false, source: null });
  });

  it("is entitled by a specific purchase", async () => {
    const r = await checkEntitlement(client([{ source: "purchase", workflow_id: "w1", expires_at: null }]), "u1", "w1");
    expect(r).toEqual({ entitled: true, source: "purchase" });
  });

  it("is entitled by an all-access (null workflow_id) VIP grant", async () => {
    const r = await checkEntitlement(client([{ source: "vip", workflow_id: null, expires_at: null }]), "u1", "w1");
    expect(r).toEqual({ entitled: true, source: "vip" });
  });

  it("prefers the specific purchase over all-access when both exist", async () => {
    const r = await checkEntitlement(
      client([
        { source: "vip", workflow_id: null, expires_at: null },
        { source: "purchase", workflow_id: "w1", expires_at: null },
      ]),
      "u1",
      "w1",
    );
    expect(r.source).toBe("purchase");
  });

  it("fails closed on a database error", async () => {
    const errClient = { from: () => fakeQuery({ data: null, error: { message: "boom" } }) } as unknown as SupabaseClient;
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await checkEntitlement(errClient, "u1", "w1")).toEqual({ entitled: false, source: null });
  });
});

describe("handleChargeRefunded (refund revokes access)", () => {
  it("marks the order refunded and deletes the purchase entitlement", async () => {
    const calls: { table: string; op: string }[] = [];
    const service = {
      from: (table: string) => {
        const q: Record<string, unknown> = {};
        const self: unknown = new Proxy(q, {
          get(_t, prop: string) {
            if (["update", "delete", "insert", "select"].includes(prop)) {
              return () => {
                calls.push({ table, op: prop });
                return self;
              };
            }
            if (prop === "single") return () => Promise.resolve({ data: { user_id: "u1", workflow_id: "w1" } });
            if (prop === "then") return (r: (v: unknown) => unknown) => r({ data: null });
            return () => self;
          },
        });
        return self;
      },
    } as unknown as SupabaseClient;

    await handleChargeRefunded(service, { payment_intent: "pi_123" } as never);

    expect(calls).toContainEqual({ table: "orders", op: "update" });
    expect(calls).toContainEqual({ table: "entitlements", op: "delete" });
  });

  it("does nothing when the charge has no payment intent", async () => {
    const service = { from: vi.fn() } as unknown as SupabaseClient;
    await handleChargeRefunded(service, { payment_intent: null } as never);
    expect((service.from as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });
});

describe("resolveUserForCheckout", () => {
  it("uses client_reference_id when present, without any DB call", async () => {
    const service = { from: vi.fn(), auth: { admin: { createUser: vi.fn() } } } as unknown as SupabaseClient;
    expect(await resolveUserForCheckout(service, { clientReferenceId: "user-1", email: "a@b.co" })).toBe("user-1");
    expect((service.from as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it("returns null with neither a reference nor an email", async () => {
    const service = {} as SupabaseClient;
    expect(await resolveUserForCheckout(service, {})).toBeNull();
  });

  it("links an anonymous buyer to an existing profile with the same email", async () => {
    const service = {
      from: () => fakeQuery({ data: { id: "existing-id" }, error: null }),
      auth: { admin: { createUser: vi.fn() } },
    } as unknown as SupabaseClient;
    expect(await resolveUserForCheckout(service, { email: "a@b.co" })).toBe("existing-id");
    expect(service.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("creates a new auth user when no profile matches", async () => {
    const createUser = vi.fn().mockResolvedValue({ data: { user: { id: "new-id" } }, error: null });
    const service = {
      from: () => fakeQuery({ data: null, error: null }),
      auth: { admin: { createUser } },
    } as unknown as SupabaseClient;
    expect(await resolveUserForCheckout(service, { email: "new@b.co" })).toBe("new-id");
    expect(createUser).toHaveBeenCalledWith({ email: "new@b.co", email_confirm: true });
  });
});

describe("checkoutRequestSchema", () => {
  it("accepts a workflow checkout by slug and a VIP checkout by interval", () => {
    expect(checkoutRequestSchema.safeParse({ kind: "workflow", slug: "x" }).success).toBe(true);
    expect(checkoutRequestSchema.safeParse({ kind: "vip", interval: "year" }).success).toBe(true);
  });
  it("rejects unknown kinds and bad intervals", () => {
    expect(checkoutRequestSchema.safeParse({ kind: "gift" }).success).toBe(false);
    expect(checkoutRequestSchema.safeParse({ kind: "vip", interval: "week" }).success).toBe(false);
  });
});

describe("PaymentProvider adapters", () => {
  it("the LemonSqueezy stub satisfies the interface but is not implemented", async () => {
    await expect(
      lemonSqueezyPaymentProvider.createVipCheckout({ interval: "month", successUrl: "s", cancelUrl: "c" }),
    ).rejects.toThrow(/not implemented/i);
  });
});
