import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { Logo } from "@/components/layout/Logo";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthVisual } from "@/components/auth/AuthVisual";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Log In",
    description: "Log in to your FlowSaaS account to access your workflow library, tools, and billing.",
    path: "/login",
    indexable: false,
  });
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center gap-8 px-4 py-16">
        <Logo />
        <div className="w-full max-w-sm rounded-2xl border border-line/70 bg-white p-8 shadow-sm">
          <h1 className="text-h3 text-center text-ink">Log in</h1>
          <p className="mt-1.5 text-center text-sm text-ink-2">Welcome back.</p>
          <div className="mt-6">
            <Suspense fallback={null}>
              <AuthForm mode="login" />
            </Suspense>
          </div>
          <p className="mt-6 text-center text-sm text-ink-2">
            New here?{" "}
            <Link href="/signup" className="font-medium text-violet-600 hover:underline">
              Create a free account
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
