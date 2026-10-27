# Supabase or Upstash outage
1. Check provider status pages and `/api/health/deep`.
2. Expected degradation: entitlement checks fail closed (downloads denied), rate-limited routes follow their limiter policy, marketing pages are static and keep serving.
3. Verify the sandbox behaviour with the limiter down in staging (stop SRH in the integration environment) and record the result here. Do not assume.
4. Post a status note; do not disable rate limiting to "restore service".
