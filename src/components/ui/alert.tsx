import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type AlertProps = {
  variant?: "danger" | "success" | "muted";
  children: ReactNode;
  className?: string;
};

export function Alert({ variant = "danger", children, className }: AlertProps) {
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-lg px-3 py-2.5 text-[13px] leading-snug",
        variant === "danger" && "bg-danger-bg text-danger-fg",
        variant === "success" && "bg-success-bg text-success-fg",
        variant === "muted" && "bg-surface-strong text-muted border border-border",
        className
      )}
    >
      {children}
    </div>
  );
}
