import { z } from "zod";

/**
 * Every environment variable the app depends on, validated once at import
 * time. Importing this module anywhere the app boots (middleware, route
 * handlers, server components) guarantees a fast, readable failure instead
 * of an undefined-value bug surfacing deep in a request.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_VIP_MONTHLY: z.string().min(1),
  STRIPE_PRICE_VIP_ANNUAL: z.string().min(1),

  N8N_BASE_URL: z.string().url(),
  N8N_WEBHOOK_SIGNING_SECRET: z.string().min(32),
  N8N_SANDBOX_WEBHOOK_PATH: z.string().startsWith("/"),
  N8N_TOOLS_WEBHOOK_BASE: z.string().startsWith("/"),

  // "mock" runs sandbox + tools against a deterministic in-process runner
  // (no n8n needed — dev, CI, demos); "live" signs and calls N8N_BASE_URL.
  N8N_MODE: z.enum(["mock", "live"]).default("mock"),

  ENCRYPTION_KEY_BASE64: z
    .string()
    .refine((value) => Buffer.from(value, "base64").length === 32, {
      message: "ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes (AES-256-GCM)",
    }),

  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // Public: the Turnstile widget runs in the browser, so this must be NEXT_PUBLIC_.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),

  RESEND_API_KEY: z.string().min(1),

  POSTHOG_KEY: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),

  ALLOW_AI_CRAWLERS: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),

  NEXT_PUBLIC_SHOW_SEED_CONTENT: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    // Fail fast and loud at boot rather than at first use.
    throw new Error(
      `Invalid or missing environment variables:\n${issues}\n\nCheck .env.example for the full list.`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();
