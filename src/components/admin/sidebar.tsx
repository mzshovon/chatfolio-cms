"use client";

import { ADMIN_NAV_ITEMS } from "@/components/admin/nav-items";
import { Wordmark } from "@/components/ui/wordmark";
import { cn } from "@/lib/cn";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  open: boolean;
  onToggle: () => void;
};

export function AdminSidebar({ open, onToggle }: SidebarProps) {
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
          {open ? (
            <Wordmark imageClassName="h-4" />
          ) : (
            <Image
              src="/chatfolio-icon.png"
              alt=""
              width={40}
              height={40}
              className="h-[30px] w-[30px] shrink-0 rounded-[9px]"
            />
          )}
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
        {ADMIN_NAV_ITEMS.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
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
