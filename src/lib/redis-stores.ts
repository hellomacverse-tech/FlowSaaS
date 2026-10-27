import "server-only";
import { redis } from "@/lib/redis";
import type { NonceStore } from "@/lib/n8n/sign";
import type { IdempotencyStore, StoredResponse } from "@/lib/idempotency";

/** Redis `SET NX EX` is atomic, so two simultaneous requests can't both claim a nonce/key. */
export const redisNonceStore: NonceStore = {
  async claim(nonce, ttlSeconds) {
    return (await redis.set(`nonce:${nonce}`, "1", { nx: true, ex: ttlSeconds })) === "OK";
  },
};

export const redisIdempotencyStore: IdempotencyStore = {
  async claim(key, ttl) {
    return (await redis.set(key, "pending", { nx: true, ex: ttl })) === "OK";
  },
  async save(key, value, ttl) {
    if (value === null) await redis.del(key);
    else await redis.set(key, JSON.stringify(value), { ex: ttl });
  },
  async get(key) {
    const raw = await redis.get<string | StoredResponse>(key);
    if (raw === null || raw === undefined) return null;
    if (raw === "pending") return "pending";
    return typeof raw === "string" ? (JSON.parse(raw) as StoredResponse) : raw;
  },
};
