import { describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/crypto";
import { sanitizeSandboxInput, scrubPii, stripControlChars } from "@/lib/pii";
import { assertPublicUrl, isBlockedIp, parseSafeUrl, SsrfError } from "@/lib/security/ssrf";
import { signRequest, verifyRequest, InMemoryNonceStore, MAX_SKEW_MS } from "@/lib/n8n/sign";
import { N8N_VERIFY_CODE } from "@/lib/n8n/verify-node";
import { createImportToken, verifyImportToken, IMPORT_TOKEN_TTL_MS } from "@/lib/import-token";
import { generateApiKey, hashApiKey, parseBearerKey } from "@/lib/api-keys";
import { verifyTurnstile } from "@/lib/turnstile";
import { InMemoryIdempotencyStore, withIdempotency } from "@/lib/idempotency";

const KEY = randomBytes(32).toString("base64");

describe("AES-256-GCM", () => {
  it("round-trips and uses a fresh IV each time", () => {
    const a = encryptSecret("n8n_api_key_123", KEY);
    const b = encryptSecret("n8n_api_key_123", KEY);
    expect(decryptSecret(a, KEY)).toBe("n8n_api_key_123");
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });
  it("detects tampering and wrong keys", () => {
    const enc = encryptSecret("secret", KEY);
    const tampered = Buffer.from(enc.ciphertext, "base64");
    tampered[0] = tampered[0]! ^ 1;
    expect(() => decryptSecret({ ...enc, ciphertext: tampered.toString("base64") }, KEY)).toThrow();
    expect(() => decryptSecret(enc, randomBytes(32).toString("base64"))).toThrow();
  });
  it("rejects a key that isn't 32 bytes and masks to last 4", () => {
    expect(() => encryptSecret("x", Buffer.from("short").toString("base64"))).toThrow();
    expect(maskSecret("abcdefgh1234")).toBe("••••••••1234");
  });
});

describe("PII scrubbing", () => {
  it("replaces emails and phone numbers", () => {
    expect(scrubPii("mail me at Sara.K+x@example.co.uk please")).toBe("mail me at [email] please");
    expect(scrubPii("call +971 50 123 4567 now")).toBe("call [phone] now");
    expect(scrubPii("(555) 010-9999")).toBe("[phone]");
  });
  it("leaves ordinary numbers alone", () => {
    expect(scrubPii("Order #1042, 2× Linen Shirt")).toBe("Order #1042, 2× Linen Shirt");
    expect(scrubPii("4.5 stars and 12 reviews")).toBe("4.5 stars and 12 reviews");
  });
  it("strips control chars and caps length at 280", () => {
    expect(stripControlChars("a\u0000b\u0007c\nd")).toBe("abc\nd");
    expect(sanitizeSandboxInput("x".repeat(500))).toHaveLength(280);
  });
});

describe("SSRF guard", () => {
  it.each([
    "127.0.0.1", "10.0.0.5", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254",
    "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255",
    "::1", "::", "fc00::1", "fd12:3456::1", "fe80::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "::ffff:7f00:1",
    "not-an-ip",
  ])("blocks %s", (ip) => expect(isBlockedIp(ip)).toBe(true));

  it.each(["8.8.8.8", "1.1.1.1", "172.32.0.1", "172.15.255.255", "2606:4700:4700::1111", "::ffff:8.8.8.8"])(
    "allows public %s",
    (ip) => expect(isBlockedIp(ip)).toBe(false),
  );

  it("rejects non-https, embedded credentials, localhost-ish names and literal private IPs", () => {
    for (const u of [
      "http://n8n.example.com", "ftp://x.com", "https://user:pw@n8n.example.com", "https://localhost",
      "https://foo.localhost", "https://db.internal", "https://printer.local", "https://127.0.0.1", "https://[::1]",
      "https://169.254.169.254/latest/meta-data", "not a url",
    ]) expect(() => parseSafeUrl(u), u).toThrow(SsrfError);
  });

  it("accepts a normal https URL", () => {
    expect(parseSafeUrl("https://n8n.example.com/").hostname).toBe("n8n.example.com");
  });

  it("rejects a hostname if ANY resolved address is private (DNS-rebinding style mix)", async () => {
    await expect(assertPublicUrl("https://evil.example.com", async () => ["8.8.8.8", "10.0.0.1"])).rejects.toThrow(SsrfError);
    await expect(assertPublicUrl("https://evil.example.com", async () => ["127.0.0.1"])).rejects.toThrow(SsrfError);
  });
  it("accepts when all addresses are public, and fails closed on resolution errors", async () => {
    await expect(assertPublicUrl("https://ok.example.com", async () => ["8.8.8.8"])).resolves.toBeInstanceOf(URL);
    await expect(assertPublicUrl("https://x.example.com", async () => { throw new Error("nxdomain"); })).rejects.toThrow(SsrfError);
    await expect(assertPublicUrl("https://x.example.com", async () => [])).rejects.toThrow(SsrfError);
  });
});

describe("request signing", () => {
  const secret = "s".repeat(40);
  const body = JSON.stringify({ workflowSlug: "x", input: "hello" });
  const asHeaders = (h: Record<string, string>) => ({
    get: (n: string) => Object.entries(h).find(([k]) => k.toLowerCase() === n.toLowerCase())?.[1] ?? null,
  });

  it("verifies a valid request", async () => {
    const headers = signRequest(secret, body);
    expect(await verifyRequest({ secret, rawBody: body, headers: asHeaders(headers), nonceStore: new InMemoryNonceStore() })).toEqual({ ok: true });
  });
  it("rejects a tampered body, wrong secret, and missing headers", async () => {
    const headers = signRequest(secret, body);
    const store = new InMemoryNonceStore();
    expect(await verifyRequest({ secret, rawBody: body + " ", headers: asHeaders(headers), nonceStore: store })).toMatchObject({ reason: "bad-signature" });
    expect(await verifyRequest({ secret: "x".repeat(40), rawBody: body, headers: asHeaders(headers), nonceStore: store })).toMatchObject({ reason: "bad-signature" });
    expect(await verifyRequest({ secret, rawBody: body, headers: asHeaders({}), nonceStore: store })).toMatchObject({ reason: "missing-headers" });
  });
  it("rejects stale and future timestamps beyond the skew window", async () => {
    const now = 1_000_000_000_000;
    const old = signRequest(secret, body, { now: now - MAX_SKEW_MS - 1 });
    const future = signRequest(secret, body, { now: now + MAX_SKEW_MS + 1 });
    const edge = signRequest(secret, body, { now: now - MAX_SKEW_MS });
    const store = new InMemoryNonceStore();
    expect(await verifyRequest({ secret, rawBody: body, headers: asHeaders(old), nonceStore: store, now })).toMatchObject({ reason: "stale" });
    expect(await verifyRequest({ secret, rawBody: body, headers: asHeaders(future), nonceStore: store, now })).toMatchObject({ reason: "stale" });
    expect(await verifyRequest({ secret, rawBody: body, headers: asHeaders(edge), nonceStore: store, now })).toEqual({ ok: true });
  });
  it("rejects a replayed nonce, but doesn't burn nonces for bad signatures", async () => {
    const store = new InMemoryNonceStore();
    const headers = signRequest(secret, body);
    expect(await verifyRequest({ secret, rawBody: body, headers: asHeaders(headers), nonceStore: store })).toEqual({ ok: true });
    expect(await verifyRequest({ secret, rawBody: body, headers: asHeaders(headers), nonceStore: store })).toMatchObject({ reason: "replayed" });

    const forged: Record<string, string> = { ...signRequest(secret, body), "X-FlowSaaS-Signature": "0".repeat(64) };
    await verifyRequest({ secret, rawBody: body, headers: asHeaders(forged), nonceStore: store });
    expect(await store.claim(forged["X-FlowSaaS-Nonce"]!, 60)).toBe(true); // still unclaimed
  });
  it("rejects a non-hex / wrong-length signature without throwing", async () => {
    const h = { ...signRequest(secret, body), "X-FlowSaaS-Signature": "zz" };
    expect(await verifyRequest({ secret, rawBody: body, headers: asHeaders(h), nonceStore: new InMemoryNonceStore() })).toMatchObject({ reason: "bad-signature" });
  });
});

describe("n8n verification Code node, executed against the real signer", () => {
  const secret = "n".repeat(40);
  const body = JSON.stringify({ workflowSlug: "facebook-messenger-crm-google-sheets", input: "hi" });

  function runNode(headers: Record<string, string>, rawBody: string, staticData: Record<string, unknown>, env = { FLOWSAAS_SIGNING_SECRET: secret }) {
    const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    const $input = { first: () => ({ json: { headers: lower }, binary: { data: { data: Buffer.from(rawBody).toString("base64") } } }) };
    const fn = new Function("require", "$input", "$env", "$getWorkflowStaticData", "Buffer", "Date", N8N_VERIFY_CODE);
    return fn(require, $input, env, () => staticData, Buffer, Date) as { json: unknown }[];
  }

  it("accepts a request signed by lib/n8n/sign and returns the parsed body", () => {
    const out = runNode(signRequest(secret, body), body, {});
    expect(out[0]!.json).toEqual(JSON.parse(body));
  });
  it("rejects tampered body, bad secret, stale timestamp, and replay", () => {
    const sd: Record<string, unknown> = {};
    const h = signRequest(secret, body);
    expect(() => runNode(h, body + "x", {})).toThrow(/bad signature/);
    expect(() => runNode(h, body, {}, { FLOWSAAS_SIGNING_SECRET: "wrong".repeat(10) })).toThrow(/bad signature/);
    expect(() => runNode(signRequest(secret, body, { now: Date.now() - 120_000 }), body, {})).toThrow(/stale/);
    runNode(h, body, sd); // first use OK
    expect(() => runNode(h, body, sd)).toThrow(/replayed/);
  });
  it("fails closed when the secret isn't configured or headers are absent", () => {
    expect(() => runNode(signRequest(secret, body), body, {}, {} as never)).toThrow(/secret not configured/);
    expect(() => runNode({}, body, {})).toThrow(/missing/);
  });
});

describe("import tokens", () => {
  const secret = "t".repeat(40);
  it("round-trips and expires after 10 minutes", () => {
    const now = 1_700_000_000_000;
    const token = createImportToken(secret, "wf-1", "user-1", now);
    expect(verifyImportToken(secret, token, now + 1000)).toEqual({ workflowId: "wf-1", userId: "user-1" });
    expect(verifyImportToken(secret, token, now + IMPORT_TOKEN_TTL_MS + 1)).toBeNull();
  });
  it("rejects tampering, wrong secret, and garbage", () => {
    const token = createImportToken(secret, "wf-1", "user-1");
    const [body, sig] = token.split(".");
    const forgedBody = Buffer.from(JSON.stringify({ w: "wf-2", u: "user-1", exp: Date.now() + 1e6 })).toString("base64url");
    expect(verifyImportToken(secret, `${forgedBody}.${sig}`)).toBeNull();
    expect(verifyImportToken("x".repeat(40), token)).toBeNull();
    expect(verifyImportToken(secret, "garbage")).toBeNull();
    expect(verifyImportToken(secret, `${body}.`)).toBeNull();
  });
  it("is domain-separated from webhook signatures", () => {
    const body = Buffer.from(JSON.stringify({ w: "a", u: "b", exp: Date.now() + 1e6 })).toString("base64url");
    const webhookStyleSig = signRequest(secret, body)["X-FlowSaaS-Signature"]!;
    expect(verifyImportToken(secret, `${body}.${webhookStyleSig}`)).toBeNull();
  });
});

describe("API keys", () => {
  it("generates fsk_live_ keys whose hash matches and whose prefix is short", () => {
    const { key, prefix, hash } = generateApiKey();
    expect(key).toMatch(/^fsk_live_[0-9a-f]{32}$/);
    expect(prefix).toHaveLength(13);
    expect(hashApiKey(key)).toBe(hash);
    expect(generateApiKey().key).not.toBe(key);
  });
  it("parses only well-formed Bearer keys", () => {
    const { key } = generateApiKey();
    expect(parseBearerKey(`Bearer ${key}`)).toBe(key);
    for (const bad of [null, "", key, `Basic ${key}`, "Bearer fsk_live_short", `Bearer ${key}x`]) expect(parseBearerKey(bad)).toBeNull();
  });
});

describe("Turnstile", () => {
  const ok = (success: boolean, status = 200) => vi.fn().mockResolvedValue({ ok: status === 200, json: async () => ({ success }) });
  it("passes only on success:true", async () => {
    expect(await verifyTurnstile({ token: "t", secret: "s", fetchImpl: ok(true) as never })).toBe(true);
    expect(await verifyTurnstile({ token: "t", secret: "s", fetchImpl: ok(false) as never })).toBe(false);
  });
  it("fails closed on missing token, HTTP error and network failure", async () => {
    const f = ok(true);
    expect(await verifyTurnstile({ token: "", secret: "s", fetchImpl: f as never })).toBe(false);
    expect(f).not.toHaveBeenCalled();
    expect(await verifyTurnstile({ token: "t", secret: "s", fetchImpl: ok(true, 500) as never })).toBe(false);
    expect(await verifyTurnstile({ token: "t", secret: "s", fetchImpl: vi.fn().mockRejectedValue(new Error("down")) as never })).toBe(false);
  });
});

describe("idempotency", () => {
  it("runs once and replays the stored response for the same key", async () => {
    const store = new InMemoryIdempotencyStore();
    const run = vi.fn().mockResolvedValue({ status: 200, body: { n: 1 } });
    const a = await withIdempotency(store, "u1", "k1", run);
    const b = await withIdempotency(store, "u1", "k1", run);
    expect(run).toHaveBeenCalledTimes(1);
    expect(b).toMatchObject({ status: 200, body: { n: 1 }, replayed: true });
    expect(a.replayed).toBeUndefined();
  });
  it("scopes keys per user and skips the store when no key is sent", async () => {
    const store = new InMemoryIdempotencyStore();
    const run = vi.fn().mockResolvedValue({ status: 200, body: {} });
    await withIdempotency(store, "u1", "k", run);
    await withIdempotency(store, "u2", "k", run);
    await withIdempotency(store, "u1", null, run);
    await withIdempotency(store, "u1", null, run);
    expect(run).toHaveBeenCalledTimes(4);
  });
  it("returns 409 for a concurrent duplicate, and doesn't cache 5xx", async () => {
    const store = new InMemoryIdempotencyStore();
    let release!: () => void;
    const slow = () => new Promise<{ status: number; body: unknown }>((r) => { release = () => r({ status: 200, body: {} }); });
    const first = withIdempotency(store, "u", "k", slow);
    await Promise.resolve();
    expect(await withIdempotency(store, "u", "k", slow)).toMatchObject({ status: 409 });
    release();
    await first;

    const failing = vi.fn().mockResolvedValue({ status: 502, body: { ok: false } });
    await withIdempotency(store, "u", "k2", failing);
    await withIdempotency(store, "u", "k2", failing);
    expect(failing).toHaveBeenCalledTimes(2);
  });
});
