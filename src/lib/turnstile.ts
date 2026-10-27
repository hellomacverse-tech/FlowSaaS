const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Server-side Cloudflare Turnstile verification. Fails CLOSED: a missing
 * token, a network error, or a non-success response all reject — an outage
 * of the verifier must not become a way to skip bot protection.
 */
export async function verifyTurnstile(params: {
  token: string | null | undefined;
  secret: string;
  ip?: string;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  if (!params.token) return false;
  const body = new URLSearchParams({ secret: params.secret, response: params.token });
  if (params.ip && params.ip !== "unknown") body.set("remoteip", params.ip);
  try {
    const res = await (params.fetchImpl ?? fetch)(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
