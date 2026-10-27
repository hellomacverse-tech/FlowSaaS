import { z } from "zod";

/**
 * Request a Quote form (Section 9.4). `honeypot` must arrive empty — a
 * filled honeypot field is a bot signal, checked in the route handler
 * rather than here so a tripped honeypot can fail silently (200 response,
 * no insert, no email) instead of handing back a validation error that
 * teaches a bot which field to leave blank.
 */
export const quoteRequestSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(200),
  workEmail: z.string().trim().email("Enter a valid work email."),
  company: z.string().trim().min(1, "Enter your company name.").max(200),
  website: z.string().trim().url("Enter a valid URL, including https://").max(300).optional().or(z.literal("")),
  primaryGoal: z.enum([
    "messenger-crm",
    "lead-generation",
    "social-distribution",
    "ecommerce-ops",
    "ai-agent",
    "other",
  ]),
  workflowsOfInterest: z.array(z.string()).max(20).optional().default([]),
  deploymentTarget: z.enum(["n8n-cloud", "self-hosted-vps", "on-premise", "not-sure"]),
  budgetRange: z.enum(["under-1k", "1k-5k", "5k-15k", "15k-plus"]),
  timeline: z.enum(["asap", "2-4-weeks", "1-3-months", "exploring"]),
  projectDetails: z.string().trim().min(20, "Add a bit more detail (at least 20 characters).").max(2000),
  consent: z.literal(true, { errorMap: () => ({ message: "Please confirm you agree to be contacted." }) }),
  honeypot: z.string().max(0).optional().default(""),
  turnstileToken: z.string().min(1),
  utm: z.record(z.string()).optional(),
});
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export const quoteResponseSchema = z.object({
  ok: z.literal(true),
  leadId: z.string().uuid(),
});
export type QuoteResponse = z.infer<typeof quoteResponseSchema>;

/** Booking form (Section 9.4, "Book a Call" tab, step 2). */
export const bookingRequestSchema = z.object({
  slotId: z.string().uuid(),
  timezone: z.string().min(1).max(100),
  fullName: z.string().trim().min(2).max(200),
  workEmail: z.string().trim().email(),
  company: z.string().trim().min(1).max(200),
  workflowsOfInterest: z.array(z.string()).max(20).optional().default([]),
  notes: z.string().trim().max(1000).optional().default(""),
  honeypot: z.string().max(0).optional().default(""),
  turnstileToken: z.string().min(1),
});
export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export const bookingResponseSchema = z.union([
  z.object({ ok: z.literal(true), bookingId: z.string().uuid(), meetingUrl: z.string().url().optional() }),
  z.object({ ok: z.literal(false), error: z.literal("slot-taken") }),
]);
export type BookingResponse = z.infer<typeof bookingResponseSchema>;
