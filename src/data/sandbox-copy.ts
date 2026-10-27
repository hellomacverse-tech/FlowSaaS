import type { WorkflowSummary } from "@/types/domain";

interface SandboxCopy {
  placeholder: string;
  presets: string[];
  previewNote: string;
}

/**
 * The product-page sandbox demo steps through the workflow's own node list
 * (see WorkflowSandboxPreview) so it never needs step data. What it does
 * need is realistic sample input text and a plausible one-line result —
 * derived here from the workflow's integrations/category rather than
 * requiring 12 hand-authored scenario configs like the home page demo.
 */
export function getSandboxCopy(workflow: WorkflowSummary): SandboxCopy {
  if (workflow.integrations.includes("facebook-messenger")) {
    return {
      placeholder: "Hi! I saw your ad. Do you have a plan for 3 team members?",
      presets: ["Pricing question", "Booking request"],
      previewNote: "Sample reply: \u201cHi! Our 3-seat plan starts at $29/mo per seat — want a quick walkthrough?\u201d",
    };
  }
  if (workflow.integrations.includes("shopify")) {
    return {
      placeholder: "Order #1042 paid — 2× Linen Shirt, shipping to Sharjah",
      presets: ["Paid order", "Low stock alert"],
      previewNote: "Sample alert: \u201cNew order #1042 — 2× Linen Shirt — pack by 5pm (sample)\u201d",
    };
  }
  if (workflow.integrations.includes("google-places")) {
    return {
      placeholder: "Dentists in Dubai with more than 4.5 stars",
      presets: ["Real estate agents in Ajman", "Cafés in Abu Dhabi"],
      previewNote: "Sample row: \u201cBright Smile Dental — 4.8★ — contact@example.com (sample)\u201d",
    };
  }
  if (workflow.integrations.includes("webhook")) {
    return {
      placeholder: "Name: Sara — Email: sara@example.com — Message: Interested in the Growth plan",
      presets: ["Pricing enquiry", "Support request"],
      previewNote: "Sample score: \u201cUrgency 78/100 — recommend same-day follow-up (sample)\u201d",
    };
  }
  if (workflow.integrations.includes("gmail") && workflow.categories.includes("ai-llm")) {
    return {
      placeholder: "Subject: Can't log in — Body: I've tried resetting my password twice with no email.",
      presets: ["Login issue", "Billing question"],
      previewNote: "Sample classification: \u201cPriority: High · Category: Account access (sample)\u201d",
    };
  }
  if (workflow.integrations.includes("telegram") && workflow.categories.includes("ai-llm")) {
    return {
      placeholder: "What's your return policy?",
      presets: ["Return policy", "Shipping times"],
      previewNote: "Sample reply: \u201cYou can return any item within 30 days, unused, for a full refund. (sample)\u201d",
    };
  }
  if (workflow.integrations.includes("wordpress")) {
    return {
      placeholder: "New post published: \u201c5 Ways to Automate Your Agency\u201d",
      presets: ["Blog post", "Product announcement"],
      previewNote: "Sample output: LinkedIn, X, Facebook Page and Telegram versions drafted (sample)",
    };
  }
  return {
    placeholder: "Sample input for this workflow",
    presets: [],
    previewNote: "Sample output generated for this workflow's data shape.",
  };
}
