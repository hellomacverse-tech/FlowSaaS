import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Self-authenticating, expiring link for n8n's "Import from URL" (Section
 * 7.4, 10-minute signed link). n8n fetches it with no cookies, so the token
 * itself must prove who it's for. Payload is {workflowId, userId, exp}; the
 * HMAC is domain-separated ("import-token:") from webhook signatures so one
 * can never be replayed as the other. The download route re-checks
 * entitlement when the link is used — a refund kills outstanding links.
 */
export const IMPORT_TOKEN_TTL_MS = 10 * 60 * 1000;

interface Payload {
  w: string;
  u: string;
  exp: number;
}

function mac(secret: string, body: string): string {
  return createHmac("sha256", secret).update(`import-token:${body}`).digest("base64url");
}

export function createImportToken(secret: string, workflowId: string, userId: string, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ w: workflowId, u: userId, exp: now + IMPORT_TOKEN_TTL_MS } satisfies Payload)).toString("base64url");
  return `${body}.${mac(secret, body)}`;
}

export function verifyImportToken(
  secret: string,
  token: string,
  now = Date.now(),
): { workflowId: string; userId: string } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(mac(secret, body));
  const provided = Buffer.from(sig);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    return { workflowId: payload.w, userId: payload.u };
  } catch {
    return null;
  }
}
