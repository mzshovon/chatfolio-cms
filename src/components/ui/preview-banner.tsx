import type { ReactNode } from "react";

export function PreviewBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[10px] border border-border bg-surface-strong px-4 py-3 text-[12.5px] leading-relaxed text-muted">
      <span aria-hidden>🚧</span>
      <span>{children}</span>
    </div>
  );
}
