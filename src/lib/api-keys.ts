import { createHash, randomBytes } from "node:crypto";

/**
 * Public-API keys (Section 5 `api_keys`, Section 9.5): `fsk_live_` + 32 hex
 * chars. Only the sha256 is stored; the full key is shown exactly once at
 * creation. sha256 (not a slow hash) is appropriate: keys are 128 bits of
 * randomness, so there is nothing to brute-force, and we need cheap lookup
 * on every API request.
 */
export const API_KEY_PREFIX = "fsk_live_";
export const MAX_ACTIVE_KEYS = 10;

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `${API_KEY_PREFIX}${randomBytes(16).toString("hex")}`;
  return { key, prefix: key.slice(0, API_KEY_PREFIX.length + 4), hash: hashApiKey(key) };
}

export function parseBearerKey(authorization: string | null): string | null {
  const match = authorization?.match(/^Bearer\s+(fsk_live_[0-9a-f]{32})$/);
  return match?.[1] ?? null;
}
