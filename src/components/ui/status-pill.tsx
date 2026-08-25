import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type StatusPillProps = {
  tone?: "neutral" | "accent" | "success" | "danger";
  children: ReactNode;
  className?: string;
};

export function StatusPill({ tone = "neutral", children, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tone === "neutral" && "bg-border text-muted",
        tone === "accent" && "bg-accent-tint text-accent",
        tone === "success" && "bg-success-bg text-success-fg",
        tone === "danger" && "bg-danger-bg text-danger-fg",
        className
      )}
    >
      {children}
    </span>
  );
}
