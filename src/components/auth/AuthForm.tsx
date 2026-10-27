"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { siteConfig } from "@/config/site";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

  async function handleMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteConfig.url}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  async function handleOAuth(provider: "google" | "github") {
    setOauthLoading(provider);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${siteConfig.url}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    // Browser navigates away to the provider; no need to reset loading state.
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 aria-hidden="true" size={32} className="text-teal-700" />
        <p className="text-sm font-semibold text-ink">Check your email</p>
        <p className="text-sm text-ink-2">
          We sent a sign-in link to <strong>{email}</strong>. It expires in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <Button
          type="button"
          variant="secondary-outline"
          size="lg"
          loading={oauthLoading === "google"}
          disabled={oauthLoading !== null}
          onClick={() => handleOAuth("google")}
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="secondary-outline"
          size="lg"
          loading={oauthLoading === "github"}
          disabled={oauthLoading !== null}
          onClick={() => handleOAuth("github")}
        >
          Continue with GitHub
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        OR
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
        />
        {status === "error" ? (
          <p role="alert" className="text-sm font-medium text-danger">
            Something went wrong sending the link. Please try again.
          </p>
        ) : null}
        <Button type="submit" size="lg" loading={status === "sending"}>
          <Mail aria-hidden="true" size={16} />
          {mode === "signup" ? "Sign up with email" : "Send magic link"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted">
        No password needed — we&apos;ll email you a one-time sign-in link.
      </p>
    </div>
  );
}
