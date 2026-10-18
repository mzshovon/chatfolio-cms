"use client";

import { NAV_ITEMS } from "@/components/dashboard/nav-items";
import { Wordmark } from "@/components/ui/wordmark";
import { cn } from "@/lib/cn";
import { FEATURE } from "@/lib/api/billing";
import { formatDate } from "@/lib/date";
import { usePlanAccess } from "@/store/entitlements-store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  open: boolean;
  onToggle: () => void;
};

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const plan = usePlanAccess();
  const chats = plan.feature(FEATURE.recruiterChatsLimit);

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
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-brand-muted hover:bg-sidebar-hover hover:text-brand-fg"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {!open && (
        <button
          type="button"
          onClick={onToggle}
          title="Expand sidebar"
          className="mt-2.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center self-center rounded-lg text-brand-muted hover:bg-sidebar-hover hover:text-brand-fg"
        >
          <ChevronRight className="h-4 w-4" />
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
              <item.icon className="h-[18px] w-5 shrink-0" strokeWidth={1.75} />
              {open && <span className="overflow-hidden whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {open && plan.ready && (
        <div className="mb-3 rounded-xl border border-brand-border bg-sidebar-hover p-3.5">
          {plan.isFree ? (
            <>
              <div className="text-xs font-bold tracking-[0.12em] text-brand-muted">
                {plan.planName.toUpperCase()} PLAN
              </div>
              {chats && !chats.unlimited && (
                <div className="mt-1.5 text-[12.5px] leading-snug text-brand-fg/80">
                  {chats.used ?? 0} of {chats.int_value} recruiter chats used
                  {chats.period ? ` this ${chats.period === "monthly" ? "month" : "period"}` : ""}
                </div>
              )}
              <Link
                href="/dashboard/plan"
                className="mt-2.5 block w-full rounded-lg bg-accent px-2 py-2 text-center text-[13px] font-semibold text-accent-foreground hover:bg-accent-hover"
              >
                Upgrade plan
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success-fg" />
                <span className="text-xs font-bold tracking-[0.12em] text-brand-accent">
                  {plan.planName.toUpperCase()}
                </span>
              </div>
              <div className="mt-1.5 text-[12.5px] leading-snug text-brand-fg/80">
                {plan.expiresAt ? `Active · expires ${formatDate(plan.expiresAt)}` : "Active"}
              </div>
            </>
          )}
        </div>
      )}

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
