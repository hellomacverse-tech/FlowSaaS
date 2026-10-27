const COMMON = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'",
  "img-src 'self' data: blob: https://*.supabase.co", "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://*.posthog.com https://*.sentry.io",
  'frame-src https://challenges.cloudflare.com https://js.stripe.com https://www.youtube-nocookie.com',
  'report-uri /api/csp-report',
  'upgrade-insecure-requests',
];

/** Dynamic routes (/app, /login, /signup, /auth): strict per-request nonce policy. */
export function cspWithNonce(nonce: string): string {
  return [...COMMON, `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com https://js.stripe.com`].join('; ');
}

/**
 * Static/ISR marketing routes cannot carry a per-request nonce without becoming dynamic (spec 2.2).
 * Inline bootstrap scripts need 'unsafe-inline' here. Mitigated by: no user HTML on these routes, JSON-LD escaped.
 */
export function cspStatic(): string {
  return [...COMMON, "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://js.stripe.com"].join('; ');
}

export const DYNAMIC_ROUTE_RE = /^\/(app|login|signup|auth)(\/|$)/;
