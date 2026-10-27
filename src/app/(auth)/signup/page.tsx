import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo";
import { Logo } from "@/components/layout/Logo";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthVisual } from "@/components/auth/AuthVisual";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Sign Up",
    description:
      "Create a free FlowSaaS account to run the sandbox, save workflows, and start with 50 free Micro-SaaS credits.",
    path: "/signup",
    indexable: false,
  });
}

const perks = ["50 free Micro-SaaS credits every month", "Save workflows to your library", "No credit card required"];

export default function SignupPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center gap-8 px-4 py-16">
        <Logo />
        <div className="w-full max-w-sm rounded-2xl border border-line/70 bg-white p-8 shadow-sm">
          <h1 className="text-h3 text-center text-ink">Get started free</h1>
          <ul className="mt-4 flex flex-col gap-1.5">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-sm text-ink-2">
                <Check aria-hidden="true" size={15} className="shrink-0 text-teal-700" />
                {perk}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Suspense fallback={null}>
              <AuthForm mode="signup" />
            </Suspense>
          </div>
          <p className="mt-6 text-center text-sm text-ink-2">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-violet-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
        <Link href="/" className="text-sm font-medium text-muted hover:text-ink-2">
          ← Back to home
        </Link>
      </div>
      <AuthVisual />
    </div>
  );
}
