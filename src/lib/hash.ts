import "server-only";
import { createHmac } from "node:crypto";
import { env } from "@/lib/env";

/**
 * HMAC-SHA256 of an IP address, salted with the same secret used for n8n
 * webhook signing (Section 15.2: "IPs stored hashed (HMAC with rotating
 * salt)"). A dedicated `IP_HASH_SALT` env var is the natural home for this
 * once key rotation is wired up (Phase 8); reusing the webhook secret here
 * keeps Phase 2 from needing a new secret for a single low-stakes hash.
 */
export function hashIp(ip: string): string {
  return createHmac("sha256", env.N8N_WEBHOOK_SIGNING_SECRET).update(ip).digest("hex");
}

/** Best-effort client IP from standard proxy headers (Vercel sets these). */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}
