import { signRequest } from "./sign";

export interface N8nCallResult {
  status: number;
  json: unknown;
}

export class N8nCallError extends Error {
  constructor(
    public kind: "timeout" | "network",
    message: string,
  ) {
    super(message);
    this.name = "N8nCallError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Signed POST to our own n8n (never the browser's business — Section 7.1).
 * One retry on 502/503 with jitter (Section 7.5): those are what a queue-mode
 * worker restart or a briefly-saturated webhook worker looks like. Network
 * failures and timeouts are NOT retried: after a timeout the workflow may
 * still be running, and blindly re-sending risks doing the work twice.
 * A fresh signature (new nonce + timestamp) is generated per attempt, since
 * the receiver rejects a replayed nonce.
 */
export async function callN8n(params: {
  baseUrl: string;
  path: string;
  body: unknown;
  secret: string;
  timeoutMs: number;
  retries?: number;
  jitterMs?: () => number;
  fetchImpl?: typeof fetch;
}): Promise<N8nCallResult> {
  const rawBody = JSON.stringify(params.body);
  const url = new URL(params.path, params.baseUrl).toString();
  const doFetch = params.fetchImpl ?? fetch;
  const maxAttempts = 1 + (params.retries ?? 1);
  const jitter = params.jitterMs ?? (() => 150 + Math.random() * 350);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response;
    try {
      response = await doFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...signRequest(params.secret, rawBody) },
        body: rawBody,
        signal: AbortSignal.timeout(params.timeoutMs),
      });
    } catch (err) {
      const isTimeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      throw new N8nCallError(isTimeout ? "timeout" : "network", err instanceof Error ? err.message : "network error");
    }

    if ((response.status === 502 || response.status === 503) && attempt < maxAttempts) {
      await sleep(jitter());
      continue;
    }

    const json = await response.json().catch(() => null);
    return { status: response.status, json };
  }
  // Unreachable: the loop always returns or throws on its final attempt.
  throw new N8nCallError("network", "exhausted retries");
}
