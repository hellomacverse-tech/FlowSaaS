import { describe, expect, it } from "vitest";
import { quoteRequestSchema, bookingRequestSchema } from "@/lib/schema/lead";

const validQuote = {
  fullName: "Amira Al-Sayed",
  workEmail: "amira@example.com",
  company: "Example Agency",
  website: "",
  primaryGoal: "messenger-crm" as const,
  workflowsOfInterest: [],
  deploymentTarget: "n8n-cloud" as const,
  budgetRange: "1k-5k" as const,
  timeline: "asap" as const,
  projectDetails: "We need to automate Messenger lead capture for our agency's five clients.",
  consent: true as const,
  honeypot: "",
  turnstileToken: "test-token",
};

describe("quoteRequestSchema", () => {
  it("accepts a fully valid submission", () => {
    const result = quoteRequestSchema.safeParse(validQuote);
    expect(result.success).toBe(true);
  });

  it("rejects a missing Turnstile token", () => {
    const { turnstileToken: _omit, ...rest } = validQuote;
    expect(quoteRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a missing consent checkbox", () => {
    const result = quoteRequestSchema.safeParse({ ...validQuote, consent: false });
    expect(result.success).toBe(false);
  });

  it("rejects project details shorter than 20 characters", () => {
    const result = quoteRequestSchema.safeParse({ ...validQuote, projectDetails: "too short" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid work email", () => {
    const result = quoteRequestSchema.safeParse({ ...validQuote, workEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown enum value for primaryGoal", () => {
    const result = quoteRequestSchema.safeParse({ ...validQuote, primaryGoal: "world-domination" });
    expect(result.success).toBe(false);
  });

  it("defaults workflowsOfInterest to an empty array when omitted", () => {
    const { workflowsOfInterest: _omit, ...rest } = validQuote;
    const result = quoteRequestSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workflowsOfInterest).toEqual([]);
    }
  });
});

const validBooking = {
  slotId: "123e4567-e89b-12d3-a456-426614174000",
  timezone: "Asia/Dubai",
  fullName: "Rafi Khan",
  workEmail: "rafi@example.com",
  company: "Rafi's Shop",
  workflowsOfInterest: [],
  notes: "",
  honeypot: "",
  turnstileToken: "test-token",
};

describe("bookingRequestSchema", () => {
  it("accepts a fully valid submission", () => {
    expect(bookingRequestSchema.safeParse(validBooking).success).toBe(true);
  });

  it("rejects a missing Turnstile token", () => {
    const { turnstileToken: _omit, ...rest } = validBooking;
    expect(bookingRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a non-UUID slotId", () => {
    expect(bookingRequestSchema.safeParse({ ...validBooking, slotId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects a missing timezone", () => {
    expect(bookingRequestSchema.safeParse({ ...validBooking, timezone: "" }).success).toBe(false);
  });
});
