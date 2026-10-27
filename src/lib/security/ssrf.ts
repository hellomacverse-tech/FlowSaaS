import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

/**
 * SSRF guard for user-supplied URLs (Section 7.4: HTTPS only, resolve DNS,
 * reject private/loopback/link-local ranges, re-resolve on connect, no
 * redirects, 5s timeout). This file is the pure, testable half: URL policy
 * and IP classification. `safe-fetch.ts` applies it at connect time.
 */
export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

const BLOCKED_V4: [string, number][] = [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (incl. cloud metadata 169.254.169.254)
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];

function isBlockedV4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  return BLOCKED_V4.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (value & mask) === (ipv4ToInt(base) & mask);
  });
}

function isBlockedV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true; // unspecified, loopback
  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible forms: judge the embedded v4.
  const mapped = lower.match(/^(?:::ffff:|::)(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isBlockedV4(mapped[1]);
  const mappedHex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex?.[1] && mappedHex[2]) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    return isBlockedV4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  const first = parseInt(lower.split(":")[0] || "0", 16);
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (lower.startsWith("64:ff9b:")) return true; // NAT64: could smuggle a private v4
  return false;
}

/** True if connecting to this address could reach something internal. */
export function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isBlockedV4(ip);
  if (version === 6) return isBlockedV6(ip);
  return true; // not a valid IP → fail closed
}

/** Syntactic URL policy: HTTPS, no credentials in the URL, no literal-IP shortcuts to blocked ranges. */
export function parseSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SsrfError("Enter a valid URL.");
  }
  if (url.protocol !== "https:") throw new SsrfError("Only https:// URLs are allowed.");
  if (url.username || url.password) throw new SsrfError("URLs with embedded credentials are not allowed.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new SsrfError("That hostname is not allowed.");
  }
  if (isIP(host) && isBlockedIp(host)) throw new SsrfError("That address is not allowed.");
  return url;
}

export type Resolver = (hostname: string) => Promise<string[]>;

const defaultResolver: Resolver = async (hostname) =>
  (await lookup(hostname, { all: true })).map((entry) => entry.address);

/**
 * Full pre-flight check: URL policy, then resolve DNS and require EVERY
 * returned address to be public (a hostname with one public and one private
 * record is rejected — an attacker controls which one gets used).
 */
export async function assertPublicUrl(raw: string, resolve: Resolver = defaultResolver): Promise<URL> {
  const url = parseSafeUrl(raw);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : await resolve(host).catch(() => []);
  if (addresses.length === 0) throw new SsrfError("Could not resolve that hostname.");
  if (addresses.some(isBlockedIp)) throw new SsrfError("That address is not allowed.");
  return url;
}
