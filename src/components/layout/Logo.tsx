import Link from "next/link";

/**
 * "Workflow node" mark: a rounded square filled with the flow gradient,
 * carrying two small white connected dots, plus the wordmark. "Saas" is
 * intentionally not styled differently from "Flow" (Section 9.0).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className="shrink-0 drop-shadow-[0_4px_10px_rgba(20,184,166,0.35)]"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="28" y2="28">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <rect width="28" height="28" rx="8" fill="url(#logo-gradient)" />
        <line x1="9" y1="19" x2="19" y2="9" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="9" cy="19" r="2.5" fill="white" />
        <circle cx="19" cy="9" r="2.5" fill="white" />
      </svg>
      <span className="font-display text-lg font-bold text-ink">FlowSaaS</span>
    </Link>
  );
}
