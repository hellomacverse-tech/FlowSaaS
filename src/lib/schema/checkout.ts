import { z } from "zod";

export const checkoutRequestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("workflow"), slug: z.string().min(1) }),
  z.object({ kind: z.literal("vip"), interval: z.enum(["month", "year"]) }),
]);
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export const checkoutResponseSchema = z.object({
  ok: z.literal(true),
  url: z.string().url(),
});
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
