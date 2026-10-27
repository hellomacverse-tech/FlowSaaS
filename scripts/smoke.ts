const BASE = process.env.SMOKE_BASE_URL;
if (!BASE) {
  console.error('SMOKE_BASE_URL is required');
  process.exit(2);
}

const checks: [string, () => Promise<boolean>][] = [
  ['home 200', async () => (await fetch(BASE)).status === 200],
  ['catalog 200', async () => (await fetch(`${BASE}/workflows`)).status === 200],
  ['product 200', async () => (await fetch(`${BASE}/workflows/facebook-messenger-crm-google-sheets`)).status === 200],
  ['robots', async () => (await (await fetch(`${BASE}/robots.txt`)).text()).includes('Sitemap:')],
  ['sitemap index', async () => (await (await fetch(`${BASE}/sitemap.xml`)).text()).includes('<sitemapindex')],
  ['llms.txt', async () => (await fetch(`${BASE}/llms.txt`)).status === 200],
  ['app gated', async () => (await fetch(`${BASE}/app`, { redirect: 'manual' })).status >= 300],
  ['liveness', async () => (await fetch(`${BASE}/api/health`)).status === 200],
  ['health deep', async () => (await fetch(`${BASE}/api/health/deep`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` } })).status === 200],
  ['csp header', async () => ((await fetch(BASE)).headers.get('content-security-policy') ?? '').includes("frame-ancestors 'none'")],
  ['og image', async () => ((await fetch(`${BASE}/og/workflows/facebook-messenger-crm-google-sheets`)).headers.get('content-type') ?? '').startsWith('image/')],
  ['no seed ribbon', async () => !(await (await fetch(BASE)).text()).includes('SAMPLE')],
];

async function main(): Promise<void> {
  let failed = 0;
  for (const [name, fn] of checks) {
    const ok = await fn().catch(() => false);
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
    if (!ok) failed++;
  }
  process.exit(failed ? 1 : 0);
}
void main();
