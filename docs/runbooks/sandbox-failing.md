# Sandbox failing / runs stuck in queued
1. `GET /api/health/deep` (Bearer CRON_SECRET): which of supabase / redis / n8n is `fail`?
2. If n8n: set `N8N_MODE=mock` in Vercel production env and redeploy. The UI already states it uses sample data, so this is honest and safe.
3. On the VPS: `docker compose ps`, `docker compose logs --tail=200 n8n-worker n8n-webhook`, check Redis queue depth.
4. Stuck rows self-heal: `/api/cron/maintenance` marks queued/running older than 60 s as `timeout`. Trigger it manually if needed.
5. Check OpenAI spend and the circuit breaker (300/hour): a trip means load, not a bug.
6. Restore `N8N_MODE=live` and redeploy only after a signed test run succeeds on staging.
