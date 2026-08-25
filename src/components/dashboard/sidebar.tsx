"use client";

import { NAV_ITEMS } from "@/components/dashboard/nav-items";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  open: boolean;
  onToggle: () => void;
};

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col bg-brand-bg px-3.5 py-5 text-brand-fg transition-[width] duration-150",
        open ? "w-[236px]" : "w-[72px]"
      )}
    >
      <div className="flex h-8 items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-accent font-serif text-[13px] font-bold text-accent-foreground">
            C
          </div>
          {open && <span className="whitespace-nowrap text-sm font-semibold">Chatfolio</span>}
        </div>
        {open && (
          <button
            type="button"
            onClick={onToggle}
            title="Collapse sidebar"
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-lg font-semibold text-brand-muted hover:bg-sidebar-hover hover:text-brand-fg"
          >
            ‹
          </button>
        )}
      </div>

      {!open && (
        <button
          type="button"
          onClick={onToggle}
          title="Expand sidebar"
          className="mt-2.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center self-center rounded-lg text-lg font-semibold text-brand-muted hover:bg-sidebar-hover hover:text-brand-fg"
        >
          ›
        </button>
      )}

      <nav className="mt-7 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center gap-3 rounded-[9px] py-2.5 text-[13.5px] font-medium",
                open ? "justify-start px-3" : "justify-center px-0",
                active ? "bg-sidebar-active text-brand-fg" : "text-brand-muted hover:bg-sidebar-hover"
              )}
            >
              <span className="w-5 shrink-0 text-center text-base">{item.icon}</span>
              {open && <span className="overflow-hidden whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "mt-2.5 border-t border-brand-border/30 pt-3 text-[11px] text-brand-muted",
          open ? "text-left" : "text-center"
        )}
      >
        {open ? "© 2026 Chatfolio. All rights reserved." : "©"}
      </div>
    </aside>
  );
}
