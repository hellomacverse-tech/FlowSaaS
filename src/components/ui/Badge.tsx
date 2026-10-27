import { cn } from "@/lib/cn";

export type BadgeTone = "coral" | "teal" | "violet" | "amber" | "slate";

const toneClasses: Record<BadgeTone, string> = {
  coral: "bg-coral-50 text-coral-700",
  teal: "bg-teal-50 text-teal-700",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-warn",
  slate: "bg-surface-2 text-ink-2",
};

export function Badge({
  tone = "slate",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Filter chip with an optional count, used by the catalog filter sidebar
 * (Section 9.2.1) and the category tablist on the home catalog preview
 * (Section 9.1.5).
 */
export function Chip({
  active = false,
  count,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
        active
          ? "bg-ink text-white border-ink"
          : "bg-white text-ink-2 border-line/70 hover:bg-surface",
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined ? (
        <span className={cn("text-xs", active ? "text-white/70" : "text-muted")}>{count}</span>
      ) : null}
    </button>
  );
}
