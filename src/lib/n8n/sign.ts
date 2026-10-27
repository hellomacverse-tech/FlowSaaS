import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Request signing contract, both directions (Section 7.2):
 *   X-FlowSaaS-Timestamp: unix ms
 *   X-FlowSaaS-Nonce:     uuid
 *   X-FlowSaaS-Signature: hex(HMAC_SHA256(secret, `${timestamp}.${nonce}.${rawBody}`))
 * The receiver rejects skew > 60s, a reused nonce, or a signature mismatch.
 */
export const HEADER_TIMESTAMP = "x-flowsaas-timestamp";
export const HEADER_NONCE = "x-flowsaas-nonce";
export const HEADER_SIGNATURE = "x-flowsaas-signature";
export const MAX_SKEW_MS = 60_000;
const NONCE_TTL_SECONDS = 120; // > 2× skew, so a replay can't slip in after the window closes

export interface NonceStore {
  /** Atomically records the nonce. Returns false if it was already seen. */
  claim(nonce: string, ttlSeconds: number): Promise<boolean>;
}

export function computeSignature(secret: string, timestamp: string, nonce: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${nonce}.${rawBody}`).digest("hex");
}

export function signRequest(
  secret: string,
  rawBody: string,
  opts: { now?: number; nonce?: string } = {},
): Record<string, string> {
  const timestamp = String(opts.now ?? Date.now());
  const nonce = opts.nonce ?? randomUUID();
  return {
    "X-FlowSaaS-Timestamp": timestamp,
    "X-FlowSaaS-Nonce": nonce,
    "X-FlowSaaS-Signature": computeSignature(secret, timestamp, nonce, rawBody),
  };
}

export type VerifyResult = { ok: true } | { ok: false; reason: "missing-headers" | "stale" | "bad-signature" | "replayed" };

export async function verifyRequest(params: {
  secret: string;
  rawBody: string;
  headers: { get(name: string): string | null };
  nonceStore: NonceStore;
  now?: number;
}): Promise<VerifyResult> {
  const timestamp = params.headers.get(HEADER_TIMESTAMP);
  const nonce = params.headers.get(HEADER_NONCE);
  const signature = params.headers.get(HEADER_SIGNATURE);
  if (!timestamp || !nonce || !signature) return { ok: false, reason: "missing-headers" };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs((params.now ?? Date.now()) - ts) > MAX_SKEW_MS) {
    return { ok: false, reason: "stale" };
  }

  const expected = Buffer.from(computeSignature(params.secret, timestamp, nonce, params.rawBody), "hex");
  const provided = Buffer.from(signature, "hex");
  // Length check first: timingSafeEqual throws on unequal lengths.
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return { ok: false, reason: "bad-signature" };
  }

  // Claim the nonce only AFTER the signature checks out, so unauthenticated
  // callers can't fill the store with junk nonces.
  if (!(await params.nonceStore.claim(nonce, NONCE_TTL_SECONDS))) return { ok: false, reason: "replayed" };
  return { ok: true };
}

/** Process-local store for tests and mock mode. Production uses Redis (`redis-stores.ts`). */
export class InMemoryNonceStore implements NonceStore {
  private seen = new Map<string, number>();
  async claim(nonce: string, ttlSeconds: number): Promise<boolean> {
    const now = Date.now();
    for (const [key, expiry] of this.seen) if (expiry <= now) this.seen.delete(key);
    if (this.seen.has(nonce)) return false;
    this.seen.set(nonce, now + ttlSeconds * 1000);
    return true;
  }
}
