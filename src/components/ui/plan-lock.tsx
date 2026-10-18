import { cn } from "@/lib/cn";
import { Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type PlanLockProps = {
  locked: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

// Greys out and blurs a section the current plan doesn't include, with an
// upgrade prompt on top. Cosmetic only — the backend rejects the underlying
// action anyway.
export function PlanLock({ locked, title, description, children, className }: PlanLockProps) {
  return (
    <div className={cn("relative", className)}>
      <div aria-hidden={locked} inert={locked} className={locked ? "pointer-events-none select-none opacity-60" : undefined}>
        {children}
      </div>
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-surface-strong/75 p-5 backdrop-blur-[2px]">
          <div className="flex max-w-[520px] flex-wrap items-center gap-4 rounded-[14px] bg-brand-bg px-5 py-4 text-brand-fg">
            <Lock className="h-4 w-4 shrink-0 text-brand-accent" strokeWidth={2} />
            <div className="min-w-[180px] flex-1">
              <div className="text-[14.5px] font-semibold">{title}</div>
              {description && <div className="mt-0.5 text-[12.5px] text-brand-muted">{description}</div>}
            </div>
            <Link
              href="/dashboard/plan"
              className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent-hover"
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
