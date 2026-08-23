import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        variant === "primary" &&
          "bg-accent text-accent-foreground hover:bg-accent-hover disabled:cursor-default disabled:bg-accent-disabled disabled:hover:bg-accent-disabled",
        variant === "secondary" &&
          "border border-border bg-surface-strong text-foreground hover:border-muted-subtle disabled:cursor-default disabled:opacity-60",
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
