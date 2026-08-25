"use client";

import { NAV_ITEMS } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/store/auth-store";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]/).filter(Boolean);
  const chars = parts.length > 1 ? [parts[0][0], parts[1][0]] : [local[0], local[1]];
  return chars.filter(Boolean).join("").toUpperCase();
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  const activeLabel =
    NAV_ITEMS.find((item) =>
      item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
    )?.label ?? "Dashboard";

  const onSignOut = async () => {
    setMenuOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-border bg-background px-7">
      <div className="font-serif text-[15px] font-semibold text-foreground">{activeLabel}</div>

      <div className="flex items-center gap-2.5">
        <ThemeToggle />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 hover:bg-surface"
          >
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-accent-tint text-[13px] font-semibold text-accent">
              {user ? initialsFromEmail(user.email) : ""}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-[13px] font-semibold text-foreground">{user?.email}</div>
              <div className="text-[11px] capitalize text-muted">{user?.role}</div>
            </div>
            <span className="text-[11px] text-muted">▾</span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-[52px] z-20 flex w-[220px] flex-col gap-0.5 rounded-[10px] border border-border bg-surface-strong p-1.5 shadow-lg">
                <span
                  title="Available once your chatfolio is published"
                  className="cursor-not-allowed rounded-md px-2.5 py-2 text-[13px] text-muted-subtle"
                >
                  View public portfolio
                </span>
                <span
                  title="Account settings aren't available yet"
                  className="cursor-not-allowed rounded-md px-2.5 py-2 text-[13px] text-muted-subtle"
                >
                  Account settings
                </span>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-md px-2.5 py-2 text-left text-[13px] font-medium text-danger-fg hover:bg-danger-bg"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
