import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { ReactNode } from "react";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[420px] rounded-2xl bg-surface p-9 shadow-sm ring-1 ring-black/5">
        {children}
      </div>
    </div>
  );
}
