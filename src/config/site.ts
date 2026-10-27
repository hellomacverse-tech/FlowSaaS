export const siteConfig = {
  name: "FlowSaaS",
  tagline: "Production-Ready n8n Workflows & Automation Marketplace",
  description:
    "Deploy battle-tested n8n workflows as templates, an all-access VIP pass, done-for-you managed setups, or browser-run Micro-SaaS tools.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://flowsaas.com",
  supportEmail: "support@flowsaas.com",
  legalDisclaimer:
    "n8n is a trademark of n8n GmbH; FlowSaaS is an independent product and is not affiliated with or endorsed by n8n, Meta, Google, Shopify or OpenAI.",
  social: {
    // Populate once real accounts exist; omitted URLs are left out of the
    // Organization JSON-LD `sameAs` array rather than filled with placeholders.
    x: "",
    linkedin: "",
  },
} as const;

export const pricingConfig = {
  vip: {
    monthly: 29,
    annual: 290,
    trialDays: 7,
    creditsIncluded: 2000,
  },
  free: {
    creditsIncluded: 50,
  },
  creditPack: {
    credits: 5000,
    price: 19,
  },
  dfy: {
    launchFrom: 499,
    growthFrom: 1499,
  },
} as const;
