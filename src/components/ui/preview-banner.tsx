import { Construction } from "lucide-react";
import type { ReactNode } from "react";

export function PreviewBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[10px] border border-border bg-surface-strong px-4 py-3 text-[12.5px] leading-relaxed text-muted">
      <Construction className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span>{children}</span>
    </div>
  );
}
