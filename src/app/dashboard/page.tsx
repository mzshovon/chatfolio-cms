"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { StatusPill } from "@/components/ui/status-pill";
import * as dashboardApi from "@/lib/api/dashboard";
import { ApiError } from "@/lib/api/http";
import * as profileApi from "@/lib/api/profile";
import * as sectionsApi from "@/lib/api/sections";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { useEffect, useState } from "react";

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning!";
  if (hour < 18) return "Good afternoon!";
  return "Good evening!";
}

export default function DashboardHomePage() {
  const authed = useAuthedRequest();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<dashboardApi.ConversationSummary[]>([]);
  const [profile, setProfile] = useState<profileApi.Profile | null>(null);
  const [sections, setSections] = useState<sectionsApi.PortfolioSection[]>([]);
  const [analytics, setAnalytics] = useState<dashboardApi.DashboardAnalytics | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [convos, prof, secs, stats] = await Promise.all([
          authed((token) => dashboardApi.listConversations(token, 4, 0)),
          authed((token) => profileApi.getProfile(token)),
          authed((token) => sectionsApi.getSections(token)),
          authed((token) => dashboardApi.getAnalytics(token)),
        ]);
        if (cancelled) return;
        setConversations(convos);
        setProfile(prof);
        setSections(secs);
        setAnalytics(stats);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Couldn't load your dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const intro = sections.find((s) => s.section_type === "intro");
  const summary = sections.find((s) => s.section_type === "summary");
  const checklist = [
    { label: "Full name set", done: Boolean(profile?.full_name) },
    { label: "Intro section approved", done: intro?.status === "approved" },
    { label: "Summary section approved", done: summary?.status === "approved" },
  ];

  const statCards = [
    {
      label: "Portfolio visitors",
      value: analytics ? formatCompact(analytics.portfolio_visitors_total) : "—",
      delta: analytics
        ? `${analytics.portfolio_visitors_delta_pct >= 0 ? "+" : ""}${analytics.portfolio_visitors_delta_pct}% this week`
        : "",
      icon: "👁",
    },
    { label: "Recruiter chats", value: String(conversations.length), delta: "recent conversations", icon: "💬" },
    {
      label: "AI tokens used",
      value: analytics ? formatCompact(analytics.ai_tokens_used) : "—",
      delta: analytics ? `of ${formatCompact(analytics.ai_tokens_monthly_quota)} monthly quota` : "",
      icon: "⚡",
    },
  ];

  const displayName = profile?.full_name || user?.email || "";

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-8 pb-10">
      {error && <Alert className="mb-5">{error}</Alert>}

      <h1 className="font-serif text-[26px] font-semibold text-foreground">
        {greeting()} <span className="font-serif italic text-accent">{displayName}</span>
      </h1>
      <p className="mt-1.5 text-[13.5px] text-muted">Here&apos;s how your chatfolio is doing today.</p>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] text-muted">{stat.label}</span>
              <span className="text-base">{stat.icon}</span>
            </div>
            <div className="mt-2.5 font-serif text-[28px] font-semibold text-foreground">
              {stat.value}
            </div>
            <div className="mt-1.5 text-[11.5px] text-success-fg">{stat.delta}</div>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Recent recruiter conversations
            </span>
            <Link
              href="/dashboard/conversations"
              className="text-[12.5px] font-semibold text-accent hover:text-accent-hover"
            >
              View all
            </Link>
          </div>
          <div className="mt-3.5 flex flex-col">
            {conversations.length === 0 && (
              <p className="py-4 text-[13px] text-muted">No recruiter conversations yet.</p>
            )}
            {conversations.map((conv) => {
              const meta = conv.recruiter_metadata;
              const initials = (meta?.name ?? "??").slice(0, 2).toUpperCase();
              return (
                <div
                  key={conv.id}
                  className="flex items-center justify-between border-b border-border py-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold text-muted">
                      {initials}
                    </div>
                    <div>
                      <div className="text-[13.5px] font-medium text-foreground">
                        {meta?.name ?? "Anonymous recruiter"}
                        {meta?.company ? ` · ${meta.company}` : ""}
                      </div>
                      <div className="mt-0.5 text-xs text-muted">
                        {meta?.role ?? "Role unknown"} ·{" "}
                        {new Date(conv.last_active_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {conv.is_flagged && <StatusPill tone="danger">Flagged</StatusPill>}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Publish checklist</span>
          <div className="mt-4 flex flex-col gap-2.5">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 text-[13px]">
                <span
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px]",
                    item.done ? "bg-success-bg text-success-fg" : "bg-danger-bg text-danger-fg"
                  )}
                >
                  {item.done ? "✓" : "!"}
                </span>
                <span className={item.done ? "text-foreground" : "text-muted"}>{item.label}</span>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/publish"
            className="mt-4 flex w-full items-center justify-center rounded-[10px] bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            Publish chatfolio
          </Link>
        </Card>
      </div>
    </div>
  );
}
