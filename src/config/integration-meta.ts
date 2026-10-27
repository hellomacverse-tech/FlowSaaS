export interface IntegrationName {
  slug: string;
  name: string;
  shortName: string;
}

/** All IntegrationSlug members from spec Section 6 plus google-places and rss (added in Phase 2). */
export const INTEGRATION_NAMES: readonly IntegrationName[] = [
  { slug: 'facebook-messenger', name: 'Facebook Messenger', shortName: 'Messenger' },
  { slug: 'openai', name: 'OpenAI', shortName: 'OpenAI' },
  { slug: 'google-sheets', name: 'Google Sheets', shortName: 'Sheets' },
  { slug: 'shopify', name: 'Shopify', shortName: 'Shopify' },
  { slug: 'airtable', name: 'Airtable', shortName: 'Airtable' },
  { slug: 'telegram', name: 'Telegram', shortName: 'Telegram' },
  { slug: 'slack', name: 'Slack', shortName: 'Slack' },
  { slug: 'gmail', name: 'Gmail', shortName: 'Gmail' },
  { slug: 'notion', name: 'Notion', shortName: 'Notion' },
  { slug: 'hubspot', name: 'HubSpot', shortName: 'HubSpot' },
  { slug: 'whatsapp-business', name: 'WhatsApp Business', shortName: 'WhatsApp' },
  { slug: 'stripe', name: 'Stripe', shortName: 'Stripe' },
  { slug: 'wordpress', name: 'WordPress', shortName: 'WordPress' },
  { slug: 'linkedin', name: 'LinkedIn', shortName: 'LinkedIn' },
  { slug: 'x-twitter', name: 'X (Twitter)', shortName: 'X' },
  { slug: 'facebook-pages', name: 'Facebook Pages', shortName: 'FB Pages' },
  { slug: 'instagram', name: 'Instagram', shortName: 'Instagram' },
  { slug: 'google-drive', name: 'Google Drive', shortName: 'Drive' },
  { slug: 'google-calendar', name: 'Google Calendar', shortName: 'Calendar' },
  { slug: 'webhook', name: 'Webhook', shortName: 'Webhook' },
  { slug: 'google-places', name: 'Google Places', shortName: 'Places' },
  { slug: 'rss', name: 'RSS', shortName: 'RSS' },
];

export interface IntegrationMeta {
  limits: readonly string[];
  authNote: string;
}

/**
 * Editorial content. A pair cannot be promoted until BOTH of its apps have an entry here
 * (enforced by scripts/audit-pseo.ts). Only two entries are authored; the rest are an editorial task.
 */
export const INTEGRATION_META: Readonly<Record<string, IntegrationMeta>> = {
  'facebook-messenger': {
    limits: [
      "Free-form replies are only allowed inside Meta's 24-hour standard messaging window after the user's last message.",
      'Production use needs the pages_messaging permission, which requires Meta App Review.',
      'Webhook events must be acknowledged quickly; do slow work asynchronously.',
    ],
    authNote: 'Page Access Token and App Secret (for X-Hub-Signature-256 verification).',
  },
  'google-sheets': {
    limits: [
      "The Sheets API enforces per-minute read and write quotas per project and per user; check Google's current quota page before high-volume use.",
      'Sheets is a poor system of record beyond tens of thousands of rows; plan an archive or database step.',
    ],
    authNote: 'Google OAuth with the Sheets scope; share the sheet with the connected account.',
  },
};

export function shortName(slug: string, fallback: string): string {
  return INTEGRATION_NAMES.find((i) => i.slug === slug)?.shortName ?? fallback;
}
