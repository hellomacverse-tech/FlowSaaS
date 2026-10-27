import { expect, test } from '@playwright/test';

test('security headers present on static, dynamic and API routes', async ({ request }) => {
  for (const path of ['/', '/workflows', '/login', '/api/health']) {
    const h = (await request.get(path)).headers();
    expect(h['strict-transport-security'], path).toMatch(/max-age=63072000/);
    expect(h['x-content-type-options'], path).toBe('nosniff');
    expect(h['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
    expect(h['content-security-policy'], path).toContain("frame-ancestors 'none'");
    expect(h['permissions-policy'], path).toMatch(/camera=\(\)/);
  }
});

test('login page uses a nonce policy, marketing does not need one', async ({ request }) => {
  const login = (await request.get('/login')).headers()['content-security-policy'] ?? '';
  expect(login).toMatch(/'nonce-[^']+'/);
});

test('open redirect via next= is neutralised', async ({ request }) => {
  for (const next of ['https://evil.example', '//evil.example']) {
    const r = await request.get(`/auth/callback?next=${encodeURIComponent(next)}`, { maxRedirects: 0 });
    expect(r.headers()['location'] ?? '').not.toMatch(/evil\.example/);
  }
});
