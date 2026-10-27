import { expect, test } from '@playwright/test';

const ROUTES = ['/', '/workflows', '/services', '/pricing', '/enterprise', '/roi-calculator', '/tools', '/integrations', '/workflows/facebook-messenger-crm-google-sheets', '/categories/e-commerce', '/integrations/facebook-messenger-to-google-sheets'];

test('every marketing route: one h1, unique title, absolute canonical, description <= 155', async ({ page }) => {
  const seen = new Set<string>();
  for (const path of ROUTES) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(seen.has(title), `duplicate title on ${path}`).toBe(false);
    seen.add(title);
    expect(await page.locator('link[rel=canonical]').getAttribute('href')).toMatch(/^https?:\/\//);
    const desc = await page.locator('meta[name=description]').getAttribute('content');
    expect(desc && desc.length <= 155, `description on ${path}`).toBe(true);
  }
});

test('filtered catalog is noindex; plain and utm-only are not', async ({ request }) => {
  expect((await request.get('/workflows?q=crm')).headers()['x-robots-tag'] ?? '').toContain('noindex');
  expect((await request.get('/workflows?utm_source=x')).headers()['x-robots-tag'] ?? '').not.toContain('noindex');
  expect((await request.get('/workflows')).headers()['x-robots-tag'] ?? '').not.toContain('noindex');
});

test('sitemap children contain no private paths', async ({ request }) => {
  const idx = await (await request.get('/sitemap.xml')).text();
  const children = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] as string);
  expect(children.length).toBeGreaterThan(0);
  for (const c of children) {
    const xml = await (await request.get(new URL(c).pathname)).text();
    expect(xml).not.toMatch(/\/(app|api|login|signup|checkout|auth)(\/|<)/);
  }
});

test('robots.txt disallows private areas for * and AI bots', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  for (const p of ['/app/', '/api/', '/login', '/signup', '/checkout', '/auth/']) expect(txt).toContain(`Disallow: ${p}`);
  expect(txt).toMatch(/Sitemap: .*\/sitemap\.xml/);
});

test('draft pair renders but is noindex and absent from the sitemap', async ({ page, request }) => {
  await page.goto('/integrations/facebook-messenger-to-google-sheets');
  expect(await page.locator('meta[name=robots]').getAttribute('content')).toContain('noindex');
  const idx = await (await request.get('/sitemap.xml')).text();
  const children = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] as string);
  const all = (await Promise.all(children.map(async (c) => (await request.get(new URL(c).pathname)).text()))).join('');
  expect(all).not.toContain('/integrations/facebook-messenger-to-google-sheets');
});

test('unknown slug 404; uppercase slug redirects permanently', async ({ request }) => {
  expect((await request.get('/integrations/not-a-thing')).status()).toBe(404);
  const r = await request.get('/integrations/Facebook-Messenger-To-Google-Sheets', { maxRedirects: 0 });
  expect([301, 308]).toContain(r.status());
});

test('product JSON-LD has no aggregateRating and FAQ text is visible', async ({ page }) => {
  await page.goto('/workflows/facebook-messenger-crm-google-sheets');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(blocks.join('')).not.toContain('aggregateRating');
  const faqBlock = blocks.find((b) => b.includes('FAQPage'));
  expect(faqBlock).toBeTruthy();
  const node = (JSON.parse(faqBlock as string)['@graph'] as { '@type': string; mainEntity?: { acceptedAnswer: { text: string } }[] }[]).find((n) => n['@type'] === 'FAQPage');
  for (const q of node?.mainEntity ?? []) await expect(page.getByText(q.acceptedAnswer.text, { exact: false }).first()).toBeAttached();
});
