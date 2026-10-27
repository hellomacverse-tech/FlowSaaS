export const dynamic = 'force-dynamic';

/** Liveness: cheap, no dependencies. For the uptime monitor. */
export function GET(): Response {
  return Response.json(
    { ok: true, sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
