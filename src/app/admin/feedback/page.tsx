"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { StatusPill } from "@/components/ui/status-pill";
import * as adminApi from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { formatDateTime } from "@/lib/date";
import { Star, X } from "lucide-react";
import { useEffect, useState } from "react";

const PAGE_SIZE = 20;
const MESSAGE_PREVIEW_LENGTH = 60;

// 0-5 star scale (Docs §8), not the usual 0-10 NPS — so it's a simple split
// rather than promoter/passive/detractor thirds: 0-3 reads as dissatisfied,
// 4-5 as satisfied.
function sentimentFor(score: number): { label: string; tone: "danger" | "success" } {
  return score <= 3 ? { label: "Detractor", tone: "danger" } : { label: "Promoter", tone: "success" };
}

function truncate(message: string | null) {
  if (!message) return "—";
  if (message.length <= MESSAGE_PREVIEW_LENGTH) return message;
  return `${message.slice(0, MESSAGE_PREVIEW_LENGTH).trimEnd()}...`;
}

export default function AdminFeedbackPage() {
  const authed = useAuthedRequest();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<adminApi.AdminFeedback[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [openMessage, setOpenMessage] = useState<adminApi.AdminFeedback | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await authed((token) => adminApi.listFeedback(token, PAGE_SIZE, page * PAGE_SIZE));
        if (cancelled) return;
        setRows(data);
        setHasNext(data.length === PAGE_SIZE);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load feedback.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="p-8">
      <h1 className="font-serif text-[22px] font-semibold text-foreground">Feedback</h1>
      <p className="mt-1 text-[13px] text-muted">
        Star ratings and comments candidates leave anonymously from the dashboard.
      </p>

      {error && <Alert className="mt-4">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <Card className="mt-5 overflow-hidden p-0">
          <div className="flex border-b border-border px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted">
            <span className="w-12">#</span>
            <span className="w-24">Score</span>
            <span className="w-28">Sentiment</span>
            <span className="flex-1">Message</span>
            <span className="w-[170px]">Submitted</span>
          </div>
          {rows.length === 0 && <p className="px-5 py-6 text-[13px] text-muted">No feedback yet.</p>}
          {rows.map((row, i) => {
            const sentiment = sentimentFor(row.nps_score);
            return (
              <div
                key={row.id}
                className="flex items-center border-b border-border px-5 py-3.5 text-[13px] last:border-b-0"
              >
                <span className="w-12 text-muted">{page * PAGE_SIZE + i + 1}</span>
                <span className="flex w-24 items-center gap-1 font-semibold text-foreground">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" strokeWidth={1.5} />
                  {row.nps_score}
                </span>
                <span className="w-28">
                  <StatusPill tone={sentiment.tone}>{sentiment.label}</StatusPill>
                </span>
                <span className="flex-1 pr-4 text-foreground">
                  {row.message ? (
                    <button
                      type="button"
                      onClick={() => setOpenMessage(row)}
                      className="text-left hover:text-accent"
                    >
                      {truncate(row.message)}
                    </button>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </span>
                <span className="w-[170px] text-muted">{formatDateTime(row.created_at)}</span>
              </div>
            );
          })}
        </Card>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12.5px] text-muted">Page {page + 1}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-[8px] border border-border bg-surface-strong px-3.5 py-2 text-[12.5px] font-semibold text-foreground disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            className="rounded-[8px] border border-border bg-surface-strong px-3.5 py-2 text-[12.5px] font-semibold text-foreground disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {openMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setOpenMessage(null)}
        >
          <div
            className="w-full max-w-[460px] rounded-2xl bg-surface-strong p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[13px] font-semibold text-foreground">
                  <Star className="h-4 w-4 fill-accent text-accent" strokeWidth={1.5} />
                  {openMessage.nps_score}
                </div>
                <StatusPill tone={sentimentFor(openMessage.nps_score).tone}>
                  {sentimentFor(openMessage.nps_score).label}
                </StatusPill>
              </div>
              <button
                type="button"
                onClick={() => setOpenMessage(null)}
                className="rounded-md p-1 text-muted hover:bg-surface hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground">
              {openMessage.message}
            </p>
            <p className="mt-4 text-[11.5px] text-muted">
              Submitted {formatDateTime(openMessage.created_at)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
