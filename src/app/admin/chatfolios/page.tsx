"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { StatusPill } from "@/components/ui/status-pill";
import * as adminApi from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

type Filter = "all" | "published" | "draft";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
];

export default function AdminChatfoliosPage() {
  const authed = useAuthedRequest();
  const [filter, setFilter] = useState<Filter>("all");
  const [chatfolios, setChatfolios] = useState<adminApi.AdminChatfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unpublishingId, setUnpublishingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const isPublished = filter === "all" ? undefined : filter === "published";
        const data = await authed((token) => adminApi.listChatfolios(token, isPublished, 50, 0));
        if (!cancelled) setChatfolios(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load chatfolios.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const onUnpublish = async (id: string) => {
    setUnpublishingId(id);
    setError(null);
    try {
      const updated = await authed((token) => adminApi.unpublishChatfolio(token, id));
      setChatfolios((prev) => prev.map((cf) => (cf.id === id ? updated : cf)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't unpublish this chatfolio.");
    } finally {
      setUnpublishingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-[22px] font-semibold text-foreground">Chatfolios</h1>
          <p className="mt-1 text-[13px] text-muted">All candidate portfolios, published and draft.</p>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-[8px] border border-border px-3.5 py-2 text-[12.5px] font-semibold",
                filter === f.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-strong text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert className="mt-4">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <Card className="mt-5 overflow-hidden p-0">
          <div className="flex border-b border-border px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted">
            <span className="flex-[1.4]">Slug</span>
            <span className="flex-[1.6]">Owner</span>
            <span className="flex-1">Status</span>
            <span className="flex-1">Published</span>
            <span className="w-[110px]" />
          </div>
          {chatfolios.length === 0 && (
            <p className="px-5 py-6 text-[13px] text-muted">No chatfolios match this filter.</p>
          )}
          {chatfolios.map((cf) => (
            <div
              key={cf.id}
              className="flex items-center border-b border-border px-5 py-3.5 last:border-b-0"
            >
              <span className="flex-[1.4] text-[13.5px] font-medium text-foreground">{cf.slug}</span>
              <span className="flex-[1.6] text-[13px] text-muted">{cf.owner_email}</span>
              <span className="flex-1">
                <StatusPill tone={cf.is_published ? "success" : "neutral"}>
                  {cf.is_published ? "Published" : "Draft"}
                </StatusPill>
              </span>
              <span className="flex-1 text-xs text-muted">
                {cf.published_at ? new Date(cf.published_at).toLocaleDateString() : "—"}
              </span>
              <span className="flex w-[110px] justify-end">
                {cf.is_published && (
                  <button
                    type="button"
                    onClick={() => onUnpublish(cf.id)}
                    disabled={unpublishingId === cf.id}
                    className="rounded-[7px] border border-danger-fg/30 bg-surface-strong px-2.5 py-1.5 text-[11.5px] font-semibold text-danger-fg disabled:opacity-60"
                  >
                    {unpublishingId === cf.id ? "…" : "Unpublish"}
                  </button>
                )}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
