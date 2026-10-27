import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let windowStart = Date.now();
let count = 0;
const MAX_PER_MINUTE = 60; // best-effort, per instance

/** Receives CSP violation reports (report-uri). Logs the directive and blocked URI only. */
export async function POST(req: Request): Promise<Response> {
  if (Date.now() - windowStart > 60_000) {
    windowStart = Date.now();
    count = 0;
  }
  if (++count > MAX_PER_MINUTE) return new Response(null, { status: 204 });
  const text = await req.text();
  if (text.length > 10_000) return new Response(null, { status: 204 });
  try {
    const parsed = JSON.parse(text) as { 'csp-report'?: Record<string, unknown> };
    const r = parsed['csp-report'];
    if (r) {
      log.warn('csp.violation', {
        directive: String(r['violated-directive'] ?? ''),
        blocked: String(r['blocked-uri'] ?? '').slice(0, 200),
        page: String(r['document-uri'] ?? '').split('?')[0],
      });
    }
  } catch {
    /* malformed report: ignore */
  }
  return new Response(null, { status: 204 });
}
