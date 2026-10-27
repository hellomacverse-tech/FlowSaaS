export interface ToolSeed {
  slug: string;
  name: string;
  description: string;
  creditsPerRun: number;
  /** JSON Schema (draft-07 subset). Drives server-side validation AND the auto-generated dashboard form. */
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  exampleInput: Record<string, unknown>;
}

/**
 * The five launch Micro-SaaS tools (Section 7.5). Each is a thin wrapper
 * around a workflow served from n8n at `${N8N_TOOLS_WEBHOOK_BASE}/{slug}`.
 * Schemas are the contract on BOTH sides: input is validated before we spend
 * an n8n execution, and n8n's response is validated before we charge credits
 * or hand the result to a customer.
 */
export const toolSeeds: ToolSeed[] = [
  {
    slug: "messenger-lead-parser",
    name: "Messenger Lead Parser",
    description: "Paste a Messenger conversation and get a structured lead: contact details, intent, budget, and a 0–100 score.",
    creditsPerRun: 1,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["conversation"],
      properties: {
        conversation: { type: "string", title: "Conversation", minLength: 10, maxLength: 4000, description: "The pasted Messenger conversation." },
      },
    },
    outputSchema: {
      type: "object",
      required: ["intent", "score", "summary", "language"],
      properties: {
        name: { type: ["string", "null"] },
        intent: { enum: ["pricing", "booking", "complaint", "support", "other"] },
        budget: { type: ["string", "null"] },
        phone: { type: ["string", "null"] },
        email: { type: ["string", "null"] },
        language: { type: "string" },
        score: { type: "integer", minimum: 0, maximum: 100 },
        summary: { type: "string" },
      },
    },
    exampleInput: { conversation: "Hi! I saw your ad. Do you have a plan for 3 team members? My email is sara@example.com, budget around $100/mo." },
  },
  {
    slug: "lead-query-enricher",
    name: "Lead Query Enricher",
    description: "Give a business type and a city; get a structured target list with a one-line pitch angle for each.",
    creditsPerRun: 2,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["businessType", "city"],
      properties: {
        businessType: { type: "string", title: "Business type", minLength: 2, maxLength: 80 },
        city: { type: "string", title: "City", minLength: 2, maxLength: 80 },
        minRating: { type: "number", title: "Minimum rating", minimum: 1, maximum: 5, default: 4 },
        limit: { type: "integer", title: "Max results", minimum: 1, maximum: 20, default: 5 },
      },
    },
    outputSchema: {
      type: "object",
      required: ["leads"],
      properties: {
        leads: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "rating", "pitch"],
            properties: {
              name: { type: "string" },
              rating: { type: "number", minimum: 0, maximum: 5 },
              website: { type: ["string", "null"] },
              pitch: { type: "string" },
            },
          },
        },
      },
    },
    exampleInput: { businessType: "dentist", city: "Dubai", minRating: 4.5, limit: 5 },
  },
  {
    slug: "caption-distributor",
    name: "Caption Distributor",
    description: "Turn one post into channel-ready captions for LinkedIn, X, Facebook, and Telegram.",
    creditsPerRun: 1,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["post", "channels"],
      properties: {
        post: { type: "string", title: "Post", minLength: 20, maxLength: 5000 },
        channels: {
          type: "array",
          title: "Channels",
          minItems: 1,
          uniqueItems: true,
          items: { enum: ["linkedin", "x", "facebook", "telegram"] },
        },
      },
    },
    outputSchema: {
      type: "object",
      required: ["variants"],
      properties: {
        variants: {
          type: "object",
          properties: {
            linkedin: { type: "string" },
            x: { type: "string", maxLength: 280 },
            facebook: { type: "string" },
            telegram: { type: "string" },
          },
        },
      },
    },
    exampleInput: { post: "We just shipped a workflow that turns every Messenger lead into a scored Google Sheets row in under a minute.", channels: ["linkedin", "x"] },
  },
  {
    slug: "order-alert-composer",
    name: "Order Alert Composer",
    description: "Compose a clear fulfilment alert for a new order, ready to post to Telegram or Slack.",
    creditsPerRun: 1,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["orderNumber", "items", "total", "shippingCity", "channel"],
      properties: {
        orderNumber: { type: "string", title: "Order number", minLength: 1, maxLength: 40 },
        items: {
          type: "array",
          title: "Items",
          minItems: 1,
          maxItems: 50,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "quantity"],
            properties: { name: { type: "string", minLength: 1, maxLength: 120 }, quantity: { type: "integer", minimum: 1, maximum: 1000 } },
          },
        },
        total: { type: "number", title: "Order total", minimum: 0 },
        shippingCity: { type: "string", title: "Shipping city", minLength: 1, maxLength: 80 },
        channel: { enum: ["telegram", "slack"], title: "Channel" },
      },
    },
    outputSchema: {
      type: "object",
      required: ["message", "priority"],
      properties: { message: { type: "string" }, priority: { enum: ["normal", "high"] } },
    },
    exampleInput: { orderNumber: "#1042", items: [{ name: "Linen Shirt", quantity: 2 }], total: 118.0, shippingCity: "Sharjah", channel: "telegram" },
  },
  {
    slug: "support-ticket-triage",
    name: "Support Ticket Triage",
    description: "Classify a support email by priority, category, and sentiment, with a one-line summary.",
    creditsPerRun: 1,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["subject", "body"],
      properties: {
        subject: { type: "string", title: "Subject", minLength: 1, maxLength: 200 },
        body: { type: "string", title: "Body", minLength: 10, maxLength: 5000 },
      },
    },
    outputSchema: {
      type: "object",
      required: ["priority", "category", "sentiment", "summary"],
      properties: {
        priority: { enum: ["low", "normal", "high", "urgent"] },
        category: { enum: ["account", "billing", "technical", "general"] },
        sentiment: { enum: ["positive", "neutral", "negative"] },
        summary: { type: "string" },
      },
    },
    exampleInput: { subject: "Can't log in", body: "I've tried resetting my password twice and no email arrives. This is blocking my whole team today." },
  },
];

export function getToolSeed(slug: string): ToolSeed | undefined {
  return toolSeeds.find((t) => t.slug === slug);
}
