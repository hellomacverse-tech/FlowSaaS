import "server-only";
import { Agent } from "undici";
import { lookup } from "node:dns";
import { assertPublicUrl, isBlockedIp, SsrfError } from "./ssrf";

/**
 * Fetch for user-supplied URLs. Two layers, because a pre-flight check alone
 * loses to DNS rebinding (name resolves public for the check, private for the
 * real request): (1) `assertPublicUrl` up front for clear errors, and (2) a
 * custom `lookup` on the connection itself that re-validates the address the
 * socket is ACTUALLY about to use ("re-resolve on connect"). Redirects are
 * never followed (a public host could 302 to an internal one); 5s timeout.
 */
const agent = new Agent({
  connect: {
    lookup: (hostname, options, callback) => {
      lookup(hostname, options, (err, address, family) => {
        if (err) return callback(err, address, family);
        const addresses = Array.isArray(address) ? address.map((a) => a.address) : [address as string];
        const blocked = addresses.find(isBlockedIp);
        if (blocked) return callback(new SsrfError("That address is not allowed."), "", 4);
        return callback(null, address, family);
      });
    },
  },
});

export async function safeFetch(rawUrl: string, init: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const url = await assertPublicUrl(rawUrl);
  return fetch(url, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
    // @ts-expect-error -- `dispatcher` is an undici extension to fetch, absent from the DOM RequestInit type
    dispatcher: agent,
  });
}
