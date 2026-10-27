export interface StoredResponse {
  status: number;
  body: unknown;
}

export interface IdempotencyStore {
  /** Set-if-absent. Returns true if this caller now owns the key. */
  claim(key: string, ttlSeconds: number): Promise<boolean>;
  /** Persist the finished response (or clear the claim with `null`). */
  save(key: string, value: StoredResponse | null, ttlSeconds: number): Promise<void>;
  get(key: string): Promise<StoredResponse | "pending" | null>;
}

const PENDING_TTL = 60;
export const IDEMPOTENCY_TTL = 24 * 60 * 60;

/**
 * `Idempotency-Key` support (Section 7.5, 24h): the first request runs; a
 * retry with the same key replays the stored response instead of running the
 * tool (and charging credits) twice; a concurrent duplicate gets 409. Keys are
 * scoped per user so one customer can't read another's replay. 5xx results
 * aren't stored — a retry after a server error should genuinely retry.
 */
export async function withIdempotency(
  store: IdempotencyStore,
  scope: string,
  headerKey: string | null,
  run: () => Promise<StoredResponse>,
): Promise<StoredResponse & { replayed?: boolean }> {
  if (!headerKey) return run();
  const key = `idem:${scope}:${headerKey}`;

  if (!(await store.claim(key, PENDING_TTL))) {
    const existing = await store.get(key);
    if (existing && existing !== "pending") return { ...existing, replayed: true };
    return { status: 409, body: { ok: false, error: "idempotency-key-in-use" } };
  }

  try {
    const result = await run();
    if (result.status < 500) await store.save(key, result, IDEMPOTENCY_TTL);
    else await store.save(key, null, 1);
    return result;
  } catch (err) {
    await store.save(key, null, 1);
    throw err;
  }
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private data = new Map<string, { value: StoredResponse | "pending"; expires: number }>();
  async claim(key: string, ttl: number) {
    const existing = this.data.get(key);
    if (existing && existing.expires > Date.now()) return false;
    this.data.set(key, { value: "pending", expires: Date.now() + ttl * 1000 });
    return true;
  }
  async save(key: string, value: StoredResponse | null, ttl: number) {
    if (value === null) this.data.delete(key);
    else this.data.set(key, { value, expires: Date.now() + ttl * 1000 });
  }
  async get(key: string) {
    const entry = this.data.get(key);
    return entry && entry.expires > Date.now() ? entry.value : null;
  }
}
