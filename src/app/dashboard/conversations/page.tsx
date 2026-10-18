"use client";

import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import * as billingApi from "@/lib/api/billing";
import * as dashboardApi from "@/lib/api/dashboard";
import { ApiError } from "@/lib/api/http";
import { cn } from "@/lib/cn";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { usePlanAccess } from "@/store/entitlements-store";
import { CheckCircle2, ChevronLeft, ChevronRight, Lock, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 20;

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

function relativeDay(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// "skill_inquiry" -> "Skill inquiry"; unknown/missing intents say nothing.
function intentLabel(intent: string | null) {
  if (!intent || intent === "unknown") return null;
  const text = intent.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

type Tab = "all" | "new";

export default function ConversationsPage() {
  const authed = useAuthedRequest();
  const plan = usePlanAccess();
  const listRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<dashboardApi.ConversationSummary[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<dashboardApi.ConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await authed((t) => dashboardApi.listConversations(t, PAGE_SIZE, (page - 1) * PAGE_SIZE));
        if (cancelled) return;
        setConversations(data);
        setSelectedId((cur) => (cur && data.some((c) => c.id === cur) ? cur : (data[0]?.id ?? null)));
        if (listRef.current) listRef.current.scrollTop = 0;
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load conversations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (!selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale detail when the list empties
      setSelected(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const data = await authed((t) => dashboardApi.getConversation(t, selectedId));
        if (!cancelled) setSelected(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load this conversation.");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const onMarkReviewed = async () => {
    if (!selected) return;
    setMarking(true);
    try {
      await authed((t) => dashboardApi.markConversationReviewed(t, selected.id));
      setSelected((prev) => (prev ? { ...prev, reviewed_by_candidate: true } : prev));
      setConversations((prev) => prev.map((c) => (c.id === selected.id ? { ...c, reviewed_by_candidate: true } : c)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't mark this as reviewed.");
    } finally {
      setMarking(false);
    }
  };

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return conversations.filter((c) => {
      if (tab === "new" && c.reviewed_by_candidate) return false;
      if (!needle) return true;
      const m = c.recruiter_metadata;
      return `${m?.name ?? ""} ${m?.company ?? ""}`.toLowerCase().includes(needle);
    });
  }, [conversations, q, tab]);

  const unreadCount = conversations.filter((c) => !c.reviewed_by_candidate).length;
  const historyDays = plan.feature(billingApi.FEATURE.chatHistoryDays);
  const limitedHistory = plan.ready && historyDays && !historyDays.unlimited;
  const hasNext = conversations.length === PAGE_SIZE;
  const meta = selected?.recruiter_metadata ?? null;
  const insightsLocked = selected?.recruiter_insights_locked ?? false;
  const firstName = meta?.name?.split(/\s+/)[0] ?? "Recruiter";

  return (
    <div className="flex flex-wrap items-stretch gap-[18px] p-7">
      <div className="flex h-[calc(100vh-140px)] min-h-[520px] min-w-[280px] flex-[0_1_360px] flex-col overflow-hidden rounded-2xl border border-border bg-surface-strong">
        <div className="border-b border-border p-3.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search recruiter or company"
            className="w-full rounded-[9px] border border-border bg-surface px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-accent"
          />
          <div className="mt-2.5 flex items-center gap-1.5">
            {(
              [
                ["all", "All"],
                ["new", `New${unreadCount ? ` · ${unreadCount}` : ""}`],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "rounded-full px-[11px] py-1.5 text-[12.5px] font-semibold",
                  tab === id ? "bg-foreground text-background" : "bg-surface text-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="px-3 pt-3">
            <Alert>{error}</Alert>
          </div>
        )}

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          )}
          {!loading &&
            visible.map((conv) => {
              const m = conv.recruiter_metadata;
              const active = conv.id === selectedId;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    "flex w-full gap-[11px] border-b border-l-[3px] border-b-border px-3.5 py-[13px] text-left",
                    active ? "border-l-accent bg-accent-tint/40" : "border-l-transparent"
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold text-muted">
                    {conv.recruiter_insights_locked ? <Lock className="h-3.5 w-3.5" /> : initialsOf(m?.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-[13.5px] text-foreground",
                          conv.reviewed_by_candidate ? "font-medium" : "font-bold"
                        )}
                      >
                        {m?.name ?? "Anonymous recruiter"}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted">{relativeDay(conv.last_active_at)}</span>
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {conv.recruiter_insights_locked
                        ? "Recruiter details hidden on your plan"
                        : `${m?.company ?? "Unknown company"}${m?.location_pref ? ` · ${m.location_pref}` : ""}`}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-x-1.5 text-[11px]">
                      <span className="text-muted">{conv.message_count} messages</span>
                      {!conv.reviewed_by_candidate && <span className="font-semibold text-accent">· New</span>}
                      {conv.is_flagged && <span className="font-semibold text-flag">· Flagged</span>}
                      {conv.recruiter_insights_locked && (
                        <span className="font-semibold text-accent">· Insights locked</span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          {!loading && visible.length === 0 && (
            <div className="p-8 text-center text-[13px] text-muted">
              {conversations.length === 0 ? "No conversations yet." : "No conversations match."}
            </div>
          )}
        </div>

        {limitedHistory && (
          <div className="border-t border-border bg-accent-tint/30 px-3.5 py-2.5 text-xs text-muted">
            Your plan shows the last {historyDays.int_value} days of chats.{" "}
            <Link href="/dashboard/plan" className="font-semibold text-accent">
              Upgrade for full history
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-border bg-surface-strong px-3.5 py-3">
          <span className="text-xs text-muted">
            {conversations.length
              ? `${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + conversations.length}`
              : "0 chats"}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border text-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex h-[30px] min-w-[30px] items-center justify-center rounded-[7px] bg-foreground px-2 text-[12.5px] font-semibold text-background">
              {page}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={!hasNext || loading}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border text-muted disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)] min-h-[520px] min-w-0 flex-[1_1_440px] flex-col overflow-hidden rounded-2xl border border-border bg-surface-strong">
        {detailLoading && (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        )}

        {!detailLoading && selected && (
          <>
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-[18px] py-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-bg text-[13px] font-bold text-brand-accent">
                {insightsLocked ? <Lock className="h-4 w-4" /> : initialsOf(meta?.name)}
              </span>
              <div className="min-w-[160px] flex-1">
                <div className="text-[14.5px] font-semibold text-foreground">
                  {meta?.name ?? "Anonymous recruiter"}
                </div>
                <div className="text-xs text-muted">
                  {insightsLocked
                    ? "Recruiter details are hidden on your plan"
                    : [meta?.role, meta?.company, meta?.location_pref].filter(Boolean).join(" · ") || "No details shared"}
                  {" · "}
                  {relativeDay(selected.last_active_at)}
                </div>
              </div>
              {selected.is_flagged && (
                <span className="rounded-full bg-danger-bg px-2.5 py-1 text-[11px] font-semibold text-danger-fg">
                  Flagged
                </span>
              )}
              {selected.reviewed_by_candidate ? (
                <span className="flex items-center gap-1 text-xs text-success-fg">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Reviewed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onMarkReviewed}
                  disabled={marking}
                  className="rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background disabled:opacity-60"
                >
                  {marking ? "Marking…" : "Mark reviewed"}
                </button>
              )}
            </div>

            {insightsLocked && (
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent-tint/40 px-[18px] py-2.5 text-xs text-muted">
                <Lock className="h-3.5 w-3.5 text-accent" />
                Who asked, and from where, is part of Recruiter insights.
                <Link href="/dashboard/plan" className="font-semibold text-accent">
                  Upgrade to unlock
                </Link>
              </div>
            )}

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-background/40 p-5">
              <div className="self-center rounded-full bg-surface px-2.5 py-1 text-[11.5px] text-muted">
                {new Date(selected.started_at).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              {selected.messages.map((m, i) => {
                const rec = m.role === "recruiter";
                const intent = rec ? null : intentLabel(m.intent);
                return rec ? (
                  <div key={i} className="flex max-w-[72%] flex-col gap-[3px] self-start">
                    <div className="pl-1 text-[11px] text-muted">
                      {insightsLocked ? "Recruiter" : firstName} · {clock(m.created_at)}
                    </div>
                    <div className="rounded-[14px_14px_14px_4px] border border-border bg-surface-strong px-[13px] py-2.5 text-[13.5px] leading-normal text-foreground">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex max-w-[72%] flex-col items-end gap-[3px] self-end">
                    <div className="pr-1 text-[11px] text-muted">Your chatfolio · {clock(m.created_at)}</div>
                    <div className="rounded-[14px_14px_4px_14px] bg-brand-bg px-[13px] py-2.5 text-[13.5px] leading-normal text-brand-fg">
                      {m.content}
                    </div>
                    {intent && <div className="pr-1 text-[11px] text-muted-subtle">Answered from: {intent}</div>}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border px-[18px] py-3 text-[12.5px] text-muted">
              Read-only. Your chatfolio answered from your approved CV sections.
            </div>
          </>
        )}

        {!detailLoading && !selected && (
          <div className="flex flex-1 flex-col items-center justify-center text-muted">
            <MessageSquare className="h-7 w-7" strokeWidth={1.5} />
            <div className="mt-2.5 text-[13.5px]">Select a conversation to read it</div>
          </div>
        )}
      </div>
    </div>
  );
}
