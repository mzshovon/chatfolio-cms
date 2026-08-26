"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import * as adminApi from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useEffect, useState } from "react";

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "danger" | "success";
}) {
  return (
    <Card>
      <span className="text-[12.5px] text-muted">{label}</span>
      <div
        className={
          "mt-2 font-serif text-[26px] font-semibold " +
          (tone === "danger" ? "text-danger-fg" : tone === "success" ? "text-success-fg" : "text-foreground")
        }
      >
        {value.toLocaleString()}
      </div>
    </Card>
  );
}

export default function AdminMetricsPage() {
  const authed = useAuthedRequest();
  const [metrics, setMetrics] = useState<adminApi.AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authed((token) => adminApi.getMetrics(token));
        if (!cancelled) setMetrics(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load metrics.");
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

  if (!metrics) {
    return (
      <div className="p-8">
        <Alert>{error ?? "Couldn't load metrics."}</Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="font-serif text-[22px] font-semibold text-foreground">Platform metrics</h1>
      <p className="mt-1 text-[13px] text-muted">Point-in-time counts across Chatfolio.</p>

      <div className="mt-6 text-[12.5px] font-semibold uppercase tracking-wide text-muted">
        Users &amp; portfolios
      </div>
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        <MetricCard label="Total users" value={metrics.total_users} />
        <MetricCard label="Total candidates" value={metrics.total_candidates} />
        <MetricCard label="Published chatfolios" value={metrics.published_chatfolios} />
      </div>

      <div className="mt-6 text-[12.5px] font-semibold uppercase tracking-wide text-muted">
        Chat activity
      </div>
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        <MetricCard label="Chat sessions" value={metrics.total_chat_sessions} />
        <MetricCard label="Chat messages" value={metrics.total_chat_messages} />
        <MetricCard label="Flagged sessions" value={metrics.flagged_chat_sessions} tone="danger" />
      </div>

      <div className="mt-6 text-[12.5px] font-semibold uppercase tracking-wide text-muted">
        CV parsing
      </div>
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        <MetricCard label="Parse succeeded" value={metrics.cv_parse_success_count} tone="success" />
        <MetricCard label="Parse failed" value={metrics.cv_parse_failed_count} tone="danger" />
      </div>
    </div>
  );
}
