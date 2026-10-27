import { cn } from "@/lib/cn";

export function Card({
  interactive = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line/70 bg-white shadow-sm",
        interactive &&
          "transition-[transform,box-shadow] duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}
