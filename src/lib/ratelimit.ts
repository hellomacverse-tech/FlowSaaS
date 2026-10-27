import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

/**
 * One sliding-window limiter per named budget, each under its own Redis key
 * prefix (Section 15.1). `identifier` is a user id or an HMAC'd IP — never a
 * raw IP (Section 15.2).
 */
const limiters = {
  quoteForm: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 h"), prefix: "rl:quote" }),
  booking: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "rl:booking" }),
  // Sandbox (Section 7.3): anon 5/h/IP, signed-in 20/h, plus a global circuit breaker.
  sandboxAnon: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "rl:sandbox-anon" }),
  sandboxUser: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 h"), prefix: "rl:sandbox-user" }),
  sandboxGlobal: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(300, "1 h"), prefix: "rl:sandbox-global" }),
  // Tools / public API per key (Section 7.5): 60/min VIP, 20/min free.
  toolFree: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m"), prefix: "rl:tool-free" }),
  toolVip: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"), prefix: "rl:tool-vip" }),
  deploy: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 h"), prefix: "rl:deploy" }),
  instances: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h"), prefix: "rl:instances" }),
} as const;

export type RateLimitName = keyof typeof limiters;

export async function checkRateLimit(name: RateLimitName, identifier: string) {
  return limiters[name].limit(identifier);
}
