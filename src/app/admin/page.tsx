"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { StatusPill } from "@/components/ui/status-pill";
import * as adminApi from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { useEffect, useState } from "react";

// No candidate-visitor-analytics or AI-token-usage endpoint exists for admins
// (only §8's plain counts) — these two stay illustrative placeholders,
// matching the template's own mock data, same treatment as the candidate
// dashboard's equivalent stat cards.
const STATIC_STATS = [
  { label: "Total visitors", value: "18,432", delta: "+9% this week", icon: "👁" },
  { label: "AI tokens used", value: "4.2M", delta: "of 10M monthly quota", icon: "⚡" },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning!";
  if (hour < 18) return "Good afternoon!";
  return "Good evening!";
}

export default function AdminDashboardPage() {
  const authed = useAuthedRequest();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<adminApi.AdminMetrics | null>(null);
  const [chatfolios, setChatfolios] = useState<adminApi.AdminChatfolio[]>([]);
  const [failedJobs, setFailedJobs] = useState<adminApi.FailedCvJob[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, cfs, jobs] = await Promise.all([
          authed((token) => adminApi.getMetrics(token)),
          authed((token) => adminApi.listChatfolios(token, undefined, 4, 0)),
          authed((token) => adminApi.listFailedCvJobs(token, 3, 0)),
        ]);
        if (cancelled) return;
        setMetrics(m);
        setChatfolios(cfs);
        setFailedJobs(jobs);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load the admin dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await authed((token) => adminApi.retryFailedCvJob(token, id));
      setFailedJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't retry this job.");
    } finally {
      setRetryingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const statCards = [
    STATIC_STATS[0],
    { label: "Recruiters engaged", value: "612", delta: "+34 this week", icon: "🧑‍💼" },
    STATIC_STATS[1],
    {
      label: "Published chatfolios",
      value: metrics ? String(metrics.published_chatfolios) : "—",
      delta: metrics ? `of ${metrics.total_candidates} candidates` : "",
      icon: "◱",
    },
  ];

  return (
    <div className="p-8 pb-10">
      {error && <Alert className="mb-5">{error}</Alert>}

      <h1 className="font-serif text-[26px] font-semibold text-foreground">
        {greeting()} <span className="font-serif italic text-accent">{user?.email}</span>
      </h1>
      <p className="mt-1.5 text-[13.5px] text-muted">
        Here&apos;s what&apos;s happening across Chatfolio today.
      </p>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
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

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Recently published chatfolios
            </span>
            <Link
              href="/admin/chatfolios"
              className="text-[12.5px] font-semibold text-accent hover:text-accent-hover"
            >
              View all
            </Link>
          </div>
          <div className="mt-3.5 flex flex-col">
            {chatfolios.length === 0 && (
              <p className="py-4 text-[13px] text-muted">No chatfolios yet.</p>
            )}
            {chatfolios.map((cf) => (
              <div
                key={cf.id}
                className="flex items-center justify-between border-b border-border py-3 last:border-b-0"
              >
                <div>
                  <div className="text-[13.5px] font-medium text-foreground">{cf.slug}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {cf.owner_email} ·{" "}
                    {cf.published_at ? new Date(cf.published_at).toLocaleDateString() : "unpublished"}
                  </div>
                </div>
                <StatusPill tone={cf.is_published ? "success" : "neutral"}>
                  {cf.is_published ? "Published" : "Draft"}
                </StatusPill>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Failed CV parse jobs</span>
            <Link
              href="/admin/cv-jobs"
              className="text-[12.5px] font-semibold text-accent hover:text-accent-hover"
            >
              View all
            </Link>
          </div>
          <div className="mt-3.5 flex flex-col gap-3">
            {failedJobs.length === 0 && (
              <p className="py-4 text-[13px] text-success-fg">No failed jobs right now.</p>
            )}
            {failedJobs.map((job) => (
              <div key={job.id} className="rounded-[9px] bg-danger-bg px-3 py-2.5">
                <div className="text-[12.5px] font-semibold text-danger-fg">{job.owner_email}</div>
                <div className="mt-0.5 text-[11.5px] text-danger-fg/80">{job.error_message}</div>
                <button
                  type="button"
                  onClick={() => onRetry(job.id)}
                  disabled={retryingId === job.id}
                  className="mt-2 rounded-[6px] border border-danger-fg/30 bg-surface-strong px-2.5 py-1 text-[11.5px] font-semibold text-danger-fg disabled:opacity-60"
                >
                  {retryingId === job.id ? "Retrying…" : "Retry"}
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
