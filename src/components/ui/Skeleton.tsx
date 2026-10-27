import { cn } from "@/lib/cn";

/**
 * Shimmering loading placeholder (Section 3.7). Shimmer animation is
 * disabled globally under `prefers-reduced-motion` (see globals.css).
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn("animate-shimmer rounded-xl bg-surface-2", className)}
      {...props}
    />
  );
}
