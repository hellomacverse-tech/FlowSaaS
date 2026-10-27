"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { HelpCircle, ChevronDown } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Badge } from "@/components/ui/Badge";

export function TopBar({ email, creditsRemaining, creditsIncluded }: { email: string; creditsRemaining: number; creditsIncluded: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const low = creditsIncluded > 0 && creditsRemaining / creditsIncluded <= 0.2;

  return (
    <header className="flex h-16 items-center justify-between border-b border-line/70 bg-white px-4 sm:px-6">
      <p className="text-sm font-semibold text-ink">Dashboard</p>

      <div className="flex items-center gap-3">
        <Badge tone={low ? "amber" : "teal"} className="hidden sm:inline-flex">
          {creditsRemaining} credits
        </Badge>
        <Link href="/workflows#faq" aria-label="Help" className="rounded-lg p-2 text-muted hover:bg-surface hover:text-ink-2">
          <HelpCircle aria-hidden="true" size={18} />
        </Link>

        <div ref={ref} className="relative">
          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-1.5 rounded-lg p-1.5 hover:bg-surface" aria-expanded={menuOpen} aria-haspopup="menu">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-violet-600">
              {email.slice(0, 2).toUpperCase()}
            </span>
            <ChevronDown aria-hidden="true" size={14} className="hidden text-muted sm:block" />
          </button>
          {menuOpen ? (
            <div role="menu" className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-line/70 bg-white p-2 shadow-md">
              <p className="truncate px-2 py-1.5 text-xs text-muted">{email}</p>
              <Link href="/app" role="menuitem" className="block rounded-lg px-2 py-1.5 text-sm text-ink-2 hover:bg-surface">
                Overview
              </Link>
              <Link href="/app/library" role="menuitem" className="block rounded-lg px-2 py-1.5 text-sm text-ink-2 hover:bg-surface">
                Library
              </Link>
              <Link href="/app/billing" role="menuitem" className="block rounded-lg px-2 py-1.5 text-sm text-ink-2 hover:bg-surface">
                Billing
              </Link>
              <div className="mt-1 border-t border-line/70 pt-1">
                <SignOutButton />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
