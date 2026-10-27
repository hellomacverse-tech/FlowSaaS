type Level = 'debug' | 'info' | 'warn' | 'error';
const SENSITIVE = /(authorization|cookie|api[_-]?key|secret|token|password|ciphertext|license|email|phone|message|input|conversation)/i;

function redact(v: unknown, depth = 0): unknown {
  if (depth > 4) return '[depth]';
  if (Array.isArray(v)) return v.slice(0, 20).map((x) => redact(x, depth + 1));
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, SENSITIVE.test(k) ? '[redacted]' : redact(val, depth + 1)]),
    );
  }
  if (typeof v === 'string') return v.length > 300 ? `${v.slice(0, 300)}…` : v;
  return v;
}

function emit(level: Level, event: string, ctx: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ t: new Date().toISOString(), level, event, env: process.env.VERCEL_ENV ?? 'local', ...(redact(ctx) as object) });
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
}

/** Structured JSON logs. Keys that can carry PII or secrets are redacted by name (spec 14: no PII, no message text). */
export const log = {
  debug: (e: string, c?: Record<string, unknown>) => emit('debug', e, c),
  info: (e: string, c?: Record<string, unknown>) => emit('info', e, c),
  warn: (e: string, c?: Record<string, unknown>) => emit('warn', e, c),
  error: (e: string, c?: Record<string, unknown>) => emit('error', e, c),
};
