"use client";

import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { StatusPill } from "@/components/ui/status-pill";
import * as dashboardApi from "@/lib/api/dashboard";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

export default function ConversationsPage() {
  const authed = useAuthedRequest();

  const [conversations, setConversations] = useState<dashboardApi.ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<dashboardApi.ConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authed((token) => dashboardApi.listConversations(token, 20, 0));
        if (cancelled) return;
        setConversations(data);
        if (data.length > 0) setSelectedId(data[0].id);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Couldn't load conversations.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const data = await authed((token) => dashboardApi.getConversation(token, selectedId));
        if (!cancelled) setSelected(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Couldn't load this conversation.");
        }
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
      await authed((token) => dashboardApi.markConversationReviewed(token, selected.id));
      setSelected((prev) => (prev ? { ...prev, reviewed_by_candidate: true } : prev));
      setConversations((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, reviewed_by_candidate: true } : c))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't mark this as reviewed.");
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const unreadCount = conversations.filter((c) => !c.reviewed_by_candidate).length;

  return (
    <div className="flex h-full">
      <div className="flex w-[340px] shrink-0 flex-col border-r border-border bg-background">
        <div className="px-5 pb-3.5 pt-5">
          <h1 className="font-serif text-[19px] font-semibold text-foreground">
            Recruiter conversations
          </h1>
          <p className="mt-1 text-[12.5px] text-muted">{unreadCount} unread</p>
        </div>

        {error && (
          <div className="px-3">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2.5 pb-2.5">
          {conversations.length === 0 && (
            <p className="px-2.5 py-4 text-[13px] text-muted">No conversations yet.</p>
          )}
          {conversations.map((conv) => {
            const meta = conv.recruiter_metadata;
            const active = conv.id === selectedId;
            const initials = (meta?.name ?? "??").slice(0, 2).toUpperCase();
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  "mb-0.5 flex cursor-pointer items-center gap-3 rounded-[11px] px-2.5 py-3",
                  active && "bg-surface"
                )}
              >
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-accent-tint text-[12.5px] font-semibold text-accent">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-[13.5px]",
                        conv.reviewed_by_candidate ? "font-medium" : "font-bold"
                      )}
                    >
                      {meta?.name ?? "Anonymous recruiter"}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted">
                      {new Date(conv.last_active_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="truncate text-xs text-muted">
                    {meta?.role ?? "Role unknown"} · {meta?.company ?? "Unknown company"}
                  </div>
                </div>
                {conv.is_flagged && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-flag" title="Flagged for review" />
                )}
                {!conv.reviewed_by_candidate && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {detailLoading && (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        )}

        {!detailLoading && selected && (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-border px-7 py-5">
              <div>
                <div className="text-[15px] font-semibold text-foreground">
                  {selected.recruiter_metadata?.name ?? "Anonymous recruiter"}
                  {selected.recruiter_metadata?.company
                    ? ` · ${selected.recruiter_metadata.company}`
                    : ""}
                </div>
                <div className="mt-0.5 text-[12.5px] text-muted">
                  {selected.recruiter_metadata?.role ?? "Role unknown"} · asked{" "}
                  {selected.messages.filter((m) => m.role === "recruiter").length} questions
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                {selected.is_flagged && <StatusPill tone="danger">Flagged</StatusPill>}
                {selected.reviewed_by_candidate ? (
                  <span className="text-xs text-success-fg">✓ Reviewed</span>
                ) : (
                  <button
                    type="button"
                    onClick={onMarkReviewed}
                    disabled={marking}
                    className="rounded-[7px] border border-border bg-surface-strong px-3.5 py-1.5 text-xs font-semibold text-foreground disabled:opacity-60"
                  >
                    {marking ? "Marking…" : "Mark reviewed"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6">
              <div className="flex flex-col gap-3.5">
                {selected.messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn("flex", m.role === "recruiter" ? "justify-start" : "justify-end")}
                  >
                    <div
                      className={cn(
                        "w-fit max-w-[70%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed text-foreground",
                        m.role === "recruiter" ? "bg-surface" : "bg-accent-tint"
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!detailLoading && !selected && (
          <div className="flex flex-1 flex-col items-center justify-center text-muted">
            <div className="text-[28px]">💬</div>
            <div className="mt-2.5 text-[13.5px]">Select a conversation to read it</div>
          </div>
        )}
      </div>
    </div>
  );
}
