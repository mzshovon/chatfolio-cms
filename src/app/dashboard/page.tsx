"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import * as dashboardApi from "@/lib/api/dashboard";
import { ApiError } from "@/lib/api/http";
import * as portfolioApi from "@/lib/api/portfolio-settings";
import * as profileApi from "@/lib/api/profile";
import * as sectionsApi from "@/lib/api/sections";
import { FEATURE } from "@/lib/api/billing";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth-store";
import { usePlanAccess } from "@/store/entitlements-store";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function relativeDay(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function initialsOf(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

type Kpi = { label: string; value: string; delta?: string; deltaTone?: "up" | "down"; note: string };

export default function DashboardHomePage() {
  const authed = useAuthedRequest();
  const user = useAuthStore((state) => state.user);
  const plan = usePlanAccess();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<dashboardApi.ConversationSummary[]>([]);
  const [profile, setProfile] = useState<profileApi.Profile | null>(null);
  const [sections, setSections] = useState<sectionsApi.PortfolioSection[]>([]);
  const [analytics, setAnalytics] = useState<dashboardApi.DashboardAnalytics | null>(null);
  const [settings, setSettings] = useState<portfolioApi.PortfolioSettings | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy link");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [convos, prof, secs, stats, portfolio] = await Promise.all([
          authed((token) => dashboardApi.listConversations(token, 4, 0)),
          authed((token) => profileApi.getProfile(token)),
          authed((token) => sectionsApi.getSections(token)),
          authed((token) => dashboardApi.getAnalytics(token)),
          authed((token) => portfolioApi.getPortfolioSettings(token)),
        ]);
        if (cancelled) return;
        setConversations(convos);
        setProfile(prof);
        setSections(secs);
        setAnalytics(stats);
        setSettings(portfolio);
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const published = settings?.is_published ?? false;
  const liveUrl = settings ? settings.subdomain : "";
  const nameSet = Boolean(profile?.full_name);
  const sectionsApproved = sections.length > 0 && sections.every((s) => s.status === "approved");
  const displayName = profile?.full_name?.split(/\s+/)[0] || user?.email || "";

  // The first unmet requirement, in the order a candidate needs to do them.
  const nextStep = !nameSet
    ? { text: "Add your name so your chatfolio can introduce you.", cta: "Open profile", href: "/dashboard/profile" }
    : !sectionsApproved
      ? { text: "Approve your AI intro and summary before going live.", cta: "Review sections", href: "/dashboard/sections" }
      : !published
        ? { text: "Publish your chatfolio so recruiters can start chatting.", cta: "Publish", href: "/dashboard/publish" }
        : null;

  const chats = plan.feature(FEATURE.recruiterChatsLimit);
  const delta = analytics?.portfolio_visitors_delta_pct;
  const kpis: Kpi[] = [
    {
      label: "Portfolio visitors",
      value: analytics ? formatCompact(analytics.portfolio_visitors_total) : "—",
      delta: delta === null || delta === undefined ? undefined : `${delta >= 0 ? "+" : ""}${delta}%`,
      deltaTone: delta !== null && delta !== undefined && delta < 0 ? "down" : "up",
      note: delta === null || delta === undefined ? "Not enough data yet" : "vs the previous 30 days",
    },
    {
      label: "Recruiter chats",
      value: chats?.used !== null && chats?.used !== undefined ? String(chats.used) : String(conversations.length),
      note:
        chats && !chats.unlimited && chats.int_value !== null
          ? `of ${chats.int_value}${chats.period === "monthly" ? " this month" : ""} on your plan`
          : "Unlimited on your plan",
    },
    {
      label: "AI tokens used",
      value: analytics ? formatCompact(analytics.ai_tokens_used) : "—",
      note: analytics ? `of ${formatCompact(analytics.ai_tokens_monthly_quota)} monthly quota` : "",
    },
  ];

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${liveUrl}`);
      setCopyLabel("Copied!");
    } catch {
      setCopyLabel("Copy failed");
    }
    setTimeout(() => setCopyLabel("Copy link"), 1500);
  };

  return (
    <div className="p-7">
      <div className="flex max-w-[1080px] flex-col gap-[18px]">
        {error && <Alert>{error}</Alert>}

        <div>
          <h1 className="font-serif text-[26px] font-semibold text-foreground">
            {greeting()}, <span className="italic text-accent">{displayName}</span>
          </h1>
          <p className="mt-1 text-[13.5px] text-muted">How recruiters are engaging with your chatfolio.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 rounded-2xl bg-brand-bg px-5 py-4 text-brand-fg">
          {published ? (
            <>
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#7fd3a0]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#3fae6a]" />
                LIVE
              </span>
              <span className="min-w-[180px] flex-1 break-all font-mono text-[15px] font-semibold">{liveUrl}</span>
              <button
                type="button"
                onClick={onCopy}
                className="rounded-lg border border-brand-border px-3 py-2 text-[12.5px] font-semibold hover:bg-white/5"
              >
                {copyLabel}
              </button>
              <Link
                href="/dashboard/publish"
                className="rounded-lg bg-accent px-3 py-2 text-[12.5px] font-semibold text-accent-foreground hover:bg-accent-hover"
              >
                Share
              </Link>
            </>
          ) : (
            <>
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#f2c27a]">
                <span className="h-2 w-2 rounded-full bg-brand-accent" />
                NOT LIVE
              </span>
              <span className="min-w-[180px] flex-1 text-sm text-brand-muted">Recruiters can&apos;t reach you yet.</span>
              <Link
                href="/dashboard/publish"
                className="rounded-lg bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-accent-foreground hover:bg-accent-hover"
              >
                Publish now
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
          {kpis.map((k) => (
            <Card key={k.label} className="bg-surface-strong px-5 py-[18px] sm:p-5">
              <div className="text-[12.5px] text-muted">{k.label}</div>
              <div className="mt-1.5 flex items-baseline gap-2.5">
                <span className="font-serif text-4xl font-semibold leading-none text-foreground">{k.value}</span>
                {k.delta && (
                  <span
                    className={cn(
                      "text-[12.5px] font-semibold",
                      k.deltaTone === "down" ? "text-danger-fg" : "text-success-fg"
                    )}
                  >
                    {k.delta}
                  </span>
                )}
              </div>
              <div className="mt-2 text-[12.5px] text-muted">{k.note}</div>
            </Card>
          ))}
        </div>

        {nextStep && (
          <div className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-accent/30 bg-accent-tint px-[18px] py-3.5">
            <span className="text-[11.5px] font-bold tracking-[0.12em] text-accent">NEXT STEP</span>
            <span className="min-w-[200px] flex-1 text-sm text-foreground">{nextStep.text}</span>
            <Link
              href={nextStep.href}
              className="rounded-lg bg-foreground px-3.5 py-2 text-[12.5px] font-semibold text-background"
            >
              {nextStep.cta}
            </Link>
          </div>
        )}

        <Card className="bg-surface-strong">
          <div className="flex items-center justify-between">
            <span className="text-[14.5px] font-semibold text-foreground">Latest conversations</span>
            <Link href="/dashboard/conversations" className="text-[12.5px] font-semibold text-accent hover:text-accent-hover">
              View all
            </Link>
          </div>
          <div className="mt-2 flex flex-col">
            {conversations.length === 0 && (
              <p className="py-4 text-[13px] text-muted">No recruiter conversations yet.</p>
            )}
            {conversations.map((conv) => {
              const meta = conv.recruiter_metadata;
              return (
                <Link
                  key={conv.id}
                  href="/dashboard/conversations"
                  className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
                >
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold text-muted">
                    {conv.recruiter_insights_locked ? <Lock className="h-3.5 w-3.5" /> : initialsOf(meta?.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-foreground">
                      {meta?.name ?? "Anonymous recruiter"}
                      {meta?.company && <span className="font-normal text-muted"> · {meta.company}</span>}
                    </span>
                    <span className="block truncate text-[12.5px] text-muted">
                      {conv.recruiter_insights_locked
                        ? "Upgrade to see who asked"
                        : meta?.role ?? "Role unknown"}{" "}
                      · {conv.message_count} messages
                      {conv.is_flagged && <span className="text-flag"> · Flagged</span>}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11.5px] text-muted">{relativeDay(conv.last_active_at)}</span>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
