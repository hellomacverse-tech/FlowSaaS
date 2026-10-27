import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SECRETS = ['SUPABASE_SERVICE_ROLE_KEY', 'ENCRYPTION_KEY_BASE64', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'N8N_WEBHOOK_SIGNING_SECRET', 'CRON_SECRET', 'TURNSTILE_SECRET_KEY', 'RESEND_API_KEY'];
const values = SECRETS.map((n) => [n, process.env[n]] as const).filter((x): x is readonly [string, string] => Boolean(x[1]) && (x[1] as string).length >= 16);

function* walk(dir: string): Generator<string> {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

let leaks = 0;
for (const file of walk('.next/static')) {
  const text = readFileSync(file, 'utf8');
  for (const [name, v] of values) {
    if (text.includes(v)) {
      console.error(`LEAK: ${name} value found in ${file}`);
      leaks++;
    }
  }
}
console.log(`scan-client-bundle: checked ${values.length} secret value(s), ${leaks} leak(s)`);
process.exit(leaks ? 1 : 0);
