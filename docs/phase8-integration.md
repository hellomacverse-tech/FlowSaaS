# Phase 8 integration notes

## 1. package.json scripts
```json
"launch:gate": "tsx scripts/launch-gate.ts",
"smoke": "tsx scripts/smoke.ts",
"import:workflow": "tsx scripts/import-workflow.ts",
"rotate:key": "tsx scripts/rotate-encryption-key.ts",
"scan:bundle": "tsx scripts/scan-client-bundle.ts",
"test:integration": "vitest run --config vitest.integration.config.ts"
```
Dev dependencies: `pnpm add -D @axe-core/playwright tsx`. Dependencies: `@sentry/nextjs`, `stripe` (already present).

## 2. Env
Add `CRON_SECRET`, `ALLOW_AI_CRAWLERS`, `OLD_KEY_BASE64`/`NEW_KEY_BASE64` (rotation only) to `.env.example`. Set `N8N_MODE=live` in Vercel Production (mock is the default).

## 3. middleware.ts (additive CSP, two tiers)
```ts
import { DYNAMIC_ROUTE_RE, cspWithNonce } from '@/lib/security/csp';
// where requestHeaders is the Headers object you pass to NextResponse.next({ request: { headers } }):
if (DYNAMIC_ROUTE_RE.test(request.nextUrl.pathname)) {
  const nonce = btoa(crypto.randomUUID());
  const csp = cspWithNonce(nonce);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp); // Next reads this to nonce its own scripts
  response.headers.set('Content-Security-Policy', csp);
}
```

## 4. next.config.ts headers() for the static tier
Apply `cspStatic()` to every route except the dynamic ones, plus the fixed headers:
```ts
{ source: '/((?!app(?:/|$)|login|signup|auth(?:/|$)).*)', headers: [{ key: 'Content-Security-Policy', value: cspStatic() }] },
{ source: '/:path*', headers: [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
] },
```
Verify the negative-lookahead source pattern in your Next version, then run tests/e2e/headers.spec.ts. Run CSP in enforce mode on staging for a week and watch `csp.violation` logs. Reconcile with whatever CSP Phase 1 already ships.

## 5. Replace console.* in API routes with `log.*` (scripts/guard-secrets.sh enforces it).

## 6. launch-gate prerequisites
The manifest generator must emit `isSkeleton: true` for generated files. Use `pnpm import:workflow <slug> <export.json> <n8nVersion>` to flip a workflow once a tested export is in place, then `pnpm sanitize:workflows`.

## 7. n8n
Import `n8n/sandbox/flowsaas-health.json` on the VPS and activate it. Follow the comments in `deploy/n8n/docker-compose.yml` regarding `$env` access.

## 8. Not written (needs code I have not seen)
Integration tests for `record_tool_run` (RPC argument names), the Stripe checkout->entitlement->refund flow (handler fixtures), sandbox PII/rate-limit tests (route request shape), and route-level SSRF tests (session cookie handling). The security matrix in the Phase 8 report lists what each must assert.
