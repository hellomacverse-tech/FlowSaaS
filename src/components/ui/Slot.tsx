import { Children, cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "@/lib/cn";

/**
 * Lightweight stand-in for Radix's Slot: merges the props Button would put
 * on a native <button> onto its single child element instead, so
 * `<Button asChild><Link href="/workflows">...</Link></Button>` renders one
 * real anchor with FlowSaaS's button styling rather than a button-wrapping-a-link.
 *
 * Falsy children (Button's `{loading ? <Spinner/> : null}`) are filtered
 * out before the single-child check, since JSX always produces an array
 * when more than one child expression is present — even when some of
 * those expressions evaluate to `null`.
 */
export const Slot = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }>(
  ({ children, className, ...props }, ref) => {
    const childArray = Children.toArray(children).filter(Boolean);
    const child = childArray[0];

    if (childArray.length !== 1 || !isValidElement<{ className?: string }>(child)) {
      return null;
    }

    return cloneElement(child, {
      ...props,
      ...(ref ? { ref } : {}),
      className: cn(className, child.props.className),
    } as Partial<unknown>);
  },
);
Slot.displayName = "Slot";
