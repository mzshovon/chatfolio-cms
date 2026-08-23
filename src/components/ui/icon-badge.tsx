import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function IconBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-[52px] w-[52px] items-center justify-center rounded-full bg-success-bg text-[22px] text-success-fg",
        className
      )}
    >
      {children}
    </div>
  );
}
