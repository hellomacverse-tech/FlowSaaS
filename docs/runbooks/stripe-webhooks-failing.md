# Stripe webhooks failing
1. Stripe Dashboard > Developers > Webhooks: note the failing event types and the status codes.
2. Sentry + logs for `/api/webhooks/stripe`. A 400 means signature: check `STRIPE_WEBHOOK_SECRET` matches the live endpoint secret (live and test secrets differ).
3. A handler failure releases its claim in `stripe_events`, so Stripe's retry is safe. Fix, then use "Resend" on failed events. Idempotency makes replays safe.
4. Run `/api/cron/reconcile-stripe` and review `missingInDb` / `staleInDb`.
