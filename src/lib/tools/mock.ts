/**
 * Deterministic in-process stand-ins for the five tool workflows
 * (`N8N_MODE=mock`). They exist so the entire pipeline — validation, credit
 * accounting, run logging, rate limits, the public API — is exercisable in
 * dev, CI and demos with no n8n and no LLM. Output is rule-based and
 * explicitly labelled as sample data where it invents anything (the lead
 * enricher fabricates businesses; they're named "Sample …" so nobody can
 * mistake them for real results). Outputs must satisfy each tool's
 * outputSchema — a unit test enforces that.
 */
type Input = Record<string, unknown>;

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /\+?\d[\d\s().-]{6,}\d/;

function hashInt(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

const mocks: Record<string, (input: Input) => unknown> = {
  "messenger-lead-parser": ({ conversation }) => {
    const text = String(conversation);
    const lower = text.toLowerCase();
    const intent = /price|pricing|cost|plan|how much/.test(lower)
      ? "pricing"
      : /book|appointment|schedule|call/.test(lower)
        ? "booking"
        : /refund|angry|terrible|worst|complain/.test(lower)
          ? "complaint"
          : /help|issue|problem|broken/.test(lower)
            ? "support"
            : "other";
    const email = text.match(EMAIL)?.[0] ?? null;
    const phone = text.match(PHONE)?.[0]?.trim() ?? null;
    const budget = text.match(/(?:\$|usd\s?)\s?\d[\d,]*(?:\/\w+)?/i)?.[0] ?? null;
    const score = Math.min(100, 30 + (intent === "pricing" || intent === "booking" ? 25 : 0) + (email ? 20 : 0) + (phone ? 15 : 0) + (budget ? 10 : 0));
    return { name: null, intent, budget, phone, email, language: /[\u0600-\u06FF]/.test(text) ? "ar" : "en", score, summary: `${intent} enquiry${budget ? ` (budget ${budget})` : ""}.` };
  },
  "lead-query-enricher": ({ businessType, city, minRating, limit }) => {
    const n = Math.min(Number(limit ?? 5), 20);
    const floor = Number(minRating ?? 4);
    const seed = hashInt(`${businessType}|${city}`);
    return {
      leads: Array.from({ length: n }, (_, i) => ({
        name: `Sample ${String(businessType)} ${i + 1} (${String(city)})`,
        rating: Math.min(5, Number((floor + ((seed >> i) % 10) / 10 * (5 - floor)).toFixed(1))),
        website: null,
        pitch: `Sample pitch: offer to automate follow-up for a ${String(businessType)} in ${String(city)}.`,
      })),
    };
  },
  "caption-distributor": ({ post, channels }) => {
    const text = String(post).trim();
    const variants: Record<string, string> = {};
    for (const ch of channels as string[]) {
      if (ch === "x") variants.x = text.length > 277 ? `${text.slice(0, 277)}…` : text;
      else if (ch === "linkedin") variants.linkedin = `${text}\n\n#automation #n8n`;
      else if (ch === "facebook") variants.facebook = `${text}\n\nLearn more on our site.`;
      else if (ch === "telegram") variants.telegram = `📣 ${text}`;
    }
    return { variants };
  },
  "order-alert-composer": ({ orderNumber, items, total, shippingCity, channel }) => {
    const lines = (items as { name: string; quantity: number }[]).map((i) => `${i.quantity}× ${i.name}`).join(", ");
    const high = Number(total) >= 500;
    const prefix = channel === "slack" ? "*New order*" : "🛍 New order";
    return { message: `${prefix} ${String(orderNumber)}: ${lines} — $${Number(total).toFixed(2)} → ${String(shippingCity)}`, priority: high ? "high" : "normal" };
  },
  "support-ticket-triage": ({ subject, body }) => {
    const text = `${String(subject)} ${String(body)}`.toLowerCase();
    const urgent = /urgent|asap|blocking|down|outage|can't log in|cannot log in/.test(text);
    const negative = /angry|terrible|worst|frustrat|unacceptable|blocking/.test(text);
    const category = /invoice|charge|refund|billing|payment/.test(text) ? "billing" : /log ?in|password|account|2fa/.test(text) ? "account" : /error|bug|crash|not working|broken/.test(text) ? "technical" : "general";
    return { priority: urgent ? "urgent" : negative ? "high" : "normal", category, sentiment: negative ? "negative" : "neutral", summary: `${category} ticket: ${String(subject).slice(0, 80)}` };
  },
};

export function runMockTool(slug: string, input: Input): unknown {
  const fn = mocks[slug];
  if (!fn) throw new Error(`No mock for tool ${slug}`);
  return fn(input);
}
