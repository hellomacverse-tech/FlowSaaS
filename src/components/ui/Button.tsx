import { forwardRef } from "react";
import { Slot } from "./Slot";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary-outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Render the child element instead of a <button>, merging props/ref onto it (e.g. wrapping a Next <Link>). */
  asChild?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5", // 36px
  md: "h-11 px-5 text-[15px] gap-2", // 44px, minimum touch target
  lg: "h-13 px-7 text-base gap-2.5", // 52px
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-cta text-white shadow-sm hover:shadow-glow-coral hover:-translate-y-px active:scale-[.98] active:translate-y-0",
  "secondary-outline":
    "bg-white text-ink border border-ink/15 hover:bg-surface active:scale-[.98]",
  ghost: "bg-transparent text-ink-2 hover:bg-surface active:scale-[.98]",
  danger:
    "bg-danger text-white hover:brightness-110 active:scale-[.98]",
};

/**
 * Primary/secondary-outline/ghost/danger button. Disabled state is 50%
 * opacity with `aria-disabled` and `cursor-not-allowed`; a `loading` button
 * stays focusable but announces busy state via `aria-busy` and swaps its
 * leading icon area for a spinner without changing width.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading = false, asChild = false, disabled, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        disabled={!asChild ? isDisabled : undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold whitespace-nowrap",
          "transition-[transform,box-shadow,background-color] duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";
