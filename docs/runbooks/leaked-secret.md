# Leaked secret
1. Rotate in the provider (Vercel, Supabase, Stripe, Resend, Cloudflare, OpenAI, Upstash) and redeploy.
2. `N8N_WEBHOOK_SIGNING_SECRET`: change in Vercel and in `deploy/n8n/.env` in one maintenance window, then `docker compose up -d`. Until both match, signed calls return 401.
3. `ENCRYPTION_KEY_BASE64`: run `scripts/rotate-encryption-key.ts` (dry run first), then deploy the new key. Keep a backup of the new key in a second location.
4. Review `audit_log` and provider access logs from the exposure window.
5. If a service-role key leaked, treat all data as exposed: assess GDPR notification duty.
