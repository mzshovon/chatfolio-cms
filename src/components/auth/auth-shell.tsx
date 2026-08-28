import { BrandPanel } from "@/components/auth/brand-panel";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";
import type { ReactNode } from "react";

type AuthShellProps = {
  quote: string;
  children: ReactNode;
};

export function AuthShell({ quote, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="flex w-full max-w-[780px] overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
        <BrandPanel quote={quote} />
        <div className="flex flex-1 flex-col bg-surface p-8 sm:p-10">
          <Wordmark className="mb-6 md:hidden" imageClassName="h-6" />
          {children}
        </div>
      </div>
    </div>
  );
}
