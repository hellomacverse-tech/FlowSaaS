import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ROUTES = ['/', '/workflows', '/workflows/facebook-messenger-crm-google-sheets', '/services', '/pricing', '/enterprise', '/roi-calculator', '/tools', '/integrations', '/integrations/facebook-messenger-to-google-sheets', '/login', '/signup', '/privacy', '/terms', '/refunds', '/security'];

for (const route of ROUTES) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.goto(route);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });
}

test('reduced motion disables sphere animation', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  const names = await page.$$eval('[aria-hidden="true"].pointer-events-none *', (els) => els.map((e) => getComputedStyle(e).animationName));
  expect(names.every((n) => n === 'none')).toBe(true);
  await ctx.close();
});
