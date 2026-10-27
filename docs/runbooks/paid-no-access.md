# Customer paid but has no access
1. Find the order: `select * from orders where stripe_session_id = '<cs_...>'`.
2. Order exists, no entitlement: re-send the Stripe event from the dashboard (idempotent).
3. No order: the event never arrived or failed. Check webhook delivery for that session, then resend.
4. Anonymous buyer: confirm an auth user exists for the checkout email and the entitlement points to that user id.
5. If unresolved within 30 minutes, grant an `admin` entitlement manually, log it in `audit_log`, and email the customer.
