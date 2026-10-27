"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Zap, KeyRound, BarChart3, Download, Server, CreditCard } from "lucide-react";
import { cn } from "@/lib/cn";

const primaryItems: { href: Route; label: string; icon: typeof LayoutDashboard }[] = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/tools", label: "Active Automation Tools", icon: Zap },
  { href: "/app/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/app/usage", label: "Usage Statistics", icon: BarChart3 },
];
const secondaryItems: { href: Route; label: string; icon: typeof LayoutDashboard }[] = [
  { href: "/app/library", label: "Library", icon: Download },
  { href: "/app/instances", label: "n8n Instances", icon: Server },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
];

function NavLink({ href, label, icon: Icon, active }: { href: Route; label: string; icon: typeof LayoutDashboard; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-violet-50 text-violet-600" : "text-ink-2 hover:bg-surface",
      )}
    >
      {active ? <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 -translate-y-1/2 translate-x-[-1px] rounded-full bg-gradient-flow" style={{ width: 3 }} /> : null}
      <Icon aria-hidden="true" size={18} strokeWidth={1.75} className="shrink-0" />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}

export function DesktopSidebar({ tier }: { tier: "free" | "vip" | "enterprise" }) {
  const pathname = usePathname();

  return (
    <aside className="hidden shrink-0 flex-col justify-between border-r border-line/70 bg-white px-3 py-5 md:flex md:w-20 lg:w-64">
      <nav aria-label="Dashboard" className="flex flex-col gap-1">
        {primaryItems.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} />
        ))}
        <div className="my-3 border-t border-line/70" />
        {secondaryItems.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} />
        ))}
      </nav>

      {tier === "free" ? (
        <div className="hidden rounded-2xl bg-violet-50 p-4 lg:block">
          <p className="text-sm font-semibold text-ink">Get 2,000 credits/mo with VIP</p>
          <Link href="/pricing#vip" className="mt-2 inline-block text-sm font-medium text-violet-600 hover:underline">
            Start Free Trial →
          </Link>
        </div>
      ) : null}
    </aside>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const items = [...primaryItems.slice(0, 3), secondaryItems[2]!];

  return (
    <nav aria-label="Dashboard" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line/70 bg-white pb-[env(safe-area-inset-bottom,0px)] md:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn("flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium", active ? "text-violet-600" : "text-muted")}
          >
            <Icon aria-hidden="true" size={19} strokeWidth={1.75} />
            {item.label === "Active Automation Tools" ? "Tools" : item.label === "API Keys" ? "Keys" : item.label}
          </Link>
        );
      })}
    </nav>
  );
}
