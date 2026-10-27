import { describe, expect, test } from 'vitest';
import Stripe from 'stripe';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const post = (body: string, sig: string) =>
  fetch(`${BASE}/api/webhooks/stripe`, { method: 'POST', headers: { 'stripe-signature': sig, 'content-type': 'application/json' }, body });

describe('stripe webhook signature', () => {
  test('missing or invalid signature is rejected with 400', async () => {
    expect((await post('{}', 't=1,v1=bad')).status).toBe(400);
    expect((await fetch(`${BASE}/api/webhooks/stripe`, { method: 'POST', body: '{}' })).status).toBe(400);
  });
  test('a correctly signed but unhandled event type is acknowledged with 200', async () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return;
    const payload = JSON.stringify({ id: `evt_test_${Date.now()}`, object: 'event', type: 'ping.test', data: { object: {} } });
    const sig = new Stripe('sk_test_dummy').webhooks.generateTestHeaderString({ payload, secret });
    expect((await post(payload, sig)).status).toBe(200);
  });
});
