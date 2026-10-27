import type { NextConfig } from "next";

// Content-Security-Policy is intentionally built without a nonce placeholder
// here because Next injects a per-request nonce into framework scripts
// automatically when `experimental.nextScriptWorkers` + strict CSP headers
// are combined with the `Content-Security-Policy` header below. Route
// handlers that render inline JSON-LD use the `<JsonLd />` component, which
// escapes `<` characters and never accepts caller-provided HTML.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://us-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co https://api.stripe.com https://challenges.cloudflare.com https://us.i.posthog.com https://us-assets.i.posthog.com",
  "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://www.youtube-nocookie.com",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Reverse-direction integration pairs that only exist as canonical
      // redirects (Section 11.2) are added here as they're identified by
      // editors, e.g.:
      // { source: "/integrations/google-sheets-to-facebook-messenger", destination: "/integrations/facebook-messenger-to-google-sheets", permanent: true },
    ];
  },
};

export default nextConfig;
