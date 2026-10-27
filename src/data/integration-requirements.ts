import type { IntegrationSlug, Requirement } from "@/types/domain";

const INTEGRATION_REQUIREMENTS: Record<IntegrationSlug, Requirement> = {
  "facebook-messenger": {
    label: "Meta developer app with a Facebook Page",
    detail: "pages_messaging permission (App Review needed for production)",
    required: true,
  },
  "facebook-pages": {
    label: "Facebook Page access",
    detail: "Page access token with pages_read_engagement / pages_manage_metadata",
    required: true,
  },
  openai: { label: "OpenAI API key", detail: "Used for the AI extraction/drafting step", required: true },
  "google-sheets": { label: "Google account", detail: "Sheets OAuth scope", required: true },
  "google-drive": { label: "Google account", detail: "Drive OAuth scope", required: true },
  "google-calendar": { label: "Google account", detail: "Calendar OAuth scope", required: true },
  "google-places": { label: "Google Cloud project", detail: "Places API enabled with billing", required: true },
  shopify: { label: "Shopify store", detail: "Admin API access token", required: true },
  airtable: { label: "Airtable account", detail: "Personal access token with base write scope", required: true },
  telegram: { label: "Telegram bot token", detail: "Created via @BotFather", required: false },
  slack: { label: "Slack workspace", detail: "Incoming webhook or bot token", required: false },
  gmail: { label: "Google account", detail: "Gmail OAuth scope (send + read)", required: true },
  notion: { label: "Notion integration token", detail: "Shared with the target database", required: true },
  hubspot: { label: "HubSpot account", detail: "Private app access token", required: true },
  "whatsapp-business": { label: "WhatsApp Business API access", detail: "via Meta Cloud API", required: true },
  stripe: { label: "Stripe account", detail: "Restricted API key", required: true },
  wordpress: { label: "WordPress site", detail: "REST API application password", required: true },
  linkedin: { label: "LinkedIn Company Page", detail: "Marketing API access", required: false },
  "x-twitter": { label: "X (Twitter) developer app", detail: "OAuth 2.0 with write access", required: false },
  instagram: { label: "Instagram professional account", detail: "Linked to a Facebook Page", required: false },
  webhook: { label: "A source that can POST JSON", detail: "your form tool or app's webhook feature", required: true },
  rss: { label: "An RSS feed URL", detail: "from your blog or content source", required: true },
};

export function requirementsForIntegrations(integrations: IntegrationSlug[]): Requirement[] {
  return [
    { label: "n8n 1.x current stable", detail: "Cloud or self-hosted", required: true },
    ...integrations.map((slug) => INTEGRATION_REQUIREMENTS[slug]),
  ];
}
