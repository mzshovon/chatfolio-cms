import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

function Dot({ filled, children }: { filled: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
        filled
          ? "bg-accent text-accent-foreground"
          : "border border-border bg-surface-strong text-muted-subtle"
      )}
    >
      {children}
    </div>
  );
}

export function StepDots({ completedSteps }: { completedSteps: 1 | 2 }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <Dot filled>1</Dot>
      <div className={cn("h-0.5 flex-1", completedSteps >= 2 ? "bg-accent" : "bg-border")} />
      <Dot filled={completedSteps >= 2}>2</Dot>
    </div>
  );
}
