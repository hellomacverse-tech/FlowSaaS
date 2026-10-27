import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { stripe } from "@/lib/payments/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "You're All Set",
    description: "Your FlowSaaS purchase is confirmed.",
    path: "/checkout/success",
    indexable: false,
  });
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  let kind: "workflow" | "vip" | null = null;
  let workflowId: string | null = null;
  let customerEmail: string | null = null;

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      kind = (session.metadata?.kind as "workflow" | "vip" | undefined) ?? null;
      workflowId = session.metadata?.workflowId ?? null;
      customerEmail = session.customer_details?.email ?? session.customer_email ?? null;
    } catch (err) {
      console.error("Failed to retrieve checkout session:", err);
    }
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignedIn = Boolean(user);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      <Logo />
      <div className="w-full max-w-md rounded-2xl border border-line/70 bg-white p-8 shadow-sm">
        <CheckCircle2 aria-hidden="true" size={36} className="mx-auto text-teal-700" />

        {kind === "vip" ? (
          <>
            <h1 className="text-h3 mt-4 text-ink">Welcome to VIP</h1>
            <p className="mt-2 text-sm text-ink-2">
              Your 7-day free trial has started. Every workflow in the catalog is now included.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-h3 mt-4 text-ink">Purchase confirmed</h1>
            <p className="mt-2 text-sm text-ink-2">
              {customerEmail
                ? `We emailed your receipt and license key to ${customerEmail}.`
                : "We emailed your receipt and license key."}
            </p>
          </>
        )}

        {isSignedIn ? (
          <div className="mt-6 flex flex-col gap-2.5">
            {kind === "workflow" && workflowId ? (
              <Button asChild size="lg">
                <a href={`/api/download/${workflowId}`}>Download your workflow</a>
              </Button>
            ) : null}
            <Button asChild size="lg" variant="secondary-outline">
              <Link href="/app">Go to your dashboard</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 rounded-xl bg-violet-50 p-4 text-sm text-ink-2">
            Check your email for a sign-in link — once you&apos;re signed in, your purchase and download are
            waiting in your library.
          </div>
        )}

        <Link href="/workflows" className="mt-6 inline-block text-sm font-medium text-violet-600 hover:underline">
          ← Back to the catalog
        </Link>
      </div>
    </div>
  );
}
