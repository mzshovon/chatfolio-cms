"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import * as adminApi from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useEffect, useState } from "react";

export default function AdminFailedCvJobsPage() {
  const authed = useAuthedRequest();
  const [jobs, setJobs] = useState<adminApi.FailedCvJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authed((token) => adminApi.listFailedCvJobs(token, 50, 0));
        if (!cancelled) setJobs(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load failed jobs.");
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
    setError(null);
    try {
      await authed((token) => adminApi.retryFailedCvJob(token, id));
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't retry this job.");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="font-serif text-[22px] font-semibold text-foreground">
        Failed CV parse jobs
      </h1>
      <p className="mt-1 text-[13px] text-muted">
        Jobs the parser couldn&apos;t complete. Retry re-enqueues them.
      </p>

      {error && <Alert className="mt-4">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : jobs.length === 0 ? (
        <div className="mt-10 flex flex-col items-center text-success-fg">
          <div className="text-2xl">✓</div>
          <p className="mt-2.5 text-[13.5px] text-muted">No failed CV jobs right now.</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {jobs.map((job) => (
            <Card key={job.id} className="flex items-start justify-between">
              <div>
                <div className="text-[13.5px] font-semibold text-foreground">{job.owner_email}</div>
                <div className="mt-1 text-[12.5px] text-danger-fg">{job.error_message}</div>
                <div className="mt-1 text-[11.5px] text-muted">
                  {new Date(job.created_at).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRetry(job.id)}
                disabled={retryingId === job.id}
                className="shrink-0 rounded-[8px] border border-border bg-surface-strong px-4 py-2 text-[12.5px] font-semibold text-foreground disabled:opacity-60"
              >
                {retryingId === job.id ? "Retrying…" : "Retry"}
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
