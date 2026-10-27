"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/Button";
import { primaryNav } from "@/config/nav";
import { cn } from "@/lib/cn";

/**
 * Signed-in state (avatar menu, "Open Dashboard") is wired up once
 * Supabase auth lands in Phase 4 (Section 8). Until then the navbar always
 * renders the signed-out CTAs described in Section 9.0.
 */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!(entry?.isIntersecting ?? true)), {
      rootMargin: "-8px 0px 0px 0px",
      threshold: 1,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      closeButtonRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function handleSheetKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    }
  }

  return (
    <>
      {/* 1px-tall sentinel the IntersectionObserver watches instead of a scroll listener. */}
      <div ref={sentinelRef} className="absolute top-0 h-px w-px" aria-hidden="true" />
      <header
        className={cn(
          "sticky top-0 z-50 h-16 bg-white/80 backdrop-blur-xl transition-shadow duration-200",
          scrolled && "shadow-sm border-b border-line/70",
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />

          <nav aria-label="Primary" className="hidden lg:flex lg:items-center lg:gap-1">
            {primaryNav.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative rounded-lg px-3 py-2 text-sm font-medium text-ink-2 transition-colors duration-200 hover:bg-surface",
                    isActive && "text-ink",
                  )}
                >
                  {link.label}
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-1.5 left-3 right-3 h-0.5 rounded-full bg-gradient-flow"
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <Button asChild variant="secondary-outline" size="sm">
              <Link href="/workflows">Browse Workflows</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-sheet"
            aria-label="Open menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <Menu aria-hidden="true" size={22} />
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div
          id="mobile-nav-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          onKeyDown={handleSheetKeyDown}
          className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden"
        >
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <Logo />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <X aria-hidden="true" size={22} />
            </button>
          </div>

          <nav aria-label="Mobile" className="flex flex-1 flex-col overflow-y-auto px-4 sm:px-6">
            {primaryNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex h-14 items-center border-b border-line/70 text-[15px] font-medium text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 border-t border-line/70 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-6">
            <Button asChild variant="secondary-outline" size="lg">
              <Link href="/workflows">Browse Workflows</Link>
            </Button>
            <Button asChild variant="primary" size="lg">
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
