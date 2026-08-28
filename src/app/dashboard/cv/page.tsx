"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { CvParsedReview } from "@/components/dashboard/cv-parsed-review";
import * as cvApi from "@/lib/api/cv";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { setCvUploadedFlag } from "@/lib/onboarding";
import { useEffect, useRef, useState } from "react";

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;
const POLL_INTERVAL_MS = 3000;

const STATUS_LABEL: Record<cvApi.CvStatus, string> = {
  pending: "Pending",
  processing: "Processing…",
  parsed: "Parsed",
  failed: "Failed",
};

const STATUS_TONE: Record<cvApi.CvStatus, "neutral" | "accent" | "success" | "danger"> = {
  pending: "neutral",
  processing: "accent",
  parsed: "success",
  failed: "danger",
};

export default function CvUploadPage() {
  const authed = useAuthedRequest();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [job, setJob] = useState<cvApi.CvJob | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; sizeBytes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!job || (job.status !== "pending" && job.status !== "processing")) return;
    const timer = setInterval(async () => {
      try {
        const next = await authed((token) => cvApi.getCvStatus(token, job.id));
        setJob(next);
        if (next.status === "parsed") setCvUploadedFlag();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't check parse status.");
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, job?.status]);

  const triggerUpload = () => fileInputRef.current?.click();

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError("Only PDF, DOC, or DOCX files are accepted.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("File is larger than the 20MB limit.");
      return;
    }

    setFileMeta({ name: file.name, sizeBytes: file.size });
    setBusy(true);
    try {
      const uploaded = await authed((token) => cvApi.uploadCv(token, file));
      setJob(uploaded);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Try again.");
      setFileMeta(null);
    } finally {
      setBusy(false);
    }
  };

  const onRetry = async () => {
    if (!job) return;
    setError(null);
    setBusy(true);
    try {
      const retried = await authed((token) => cvApi.retryCv(token, job.id));
      setJob(retried);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't retry parsing.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[680px] p-8">
      <h1 className="font-serif text-[22px] font-semibold text-foreground">CV upload</h1>
      <p className="mt-1 text-[13px] text-muted">
        PDF, DOC, or DOCX, up to 20MB. We parse it to help fill your profile.
      </p>

      <div
        onClick={triggerUpload}
        className="mt-5 cursor-pointer rounded-2xl border-2 border-dashed border-border bg-surface p-9 text-center hover:border-muted-subtle"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={onFileSelected}
        />
        <div className="text-[26px]">📄</div>
        <div className="mt-2.5 text-[13.5px] font-semibold text-foreground">
          Click to upload your CV
        </div>
        <div className="mt-1 text-xs text-muted">or drag and drop a file here</div>
      </div>

      {error && <Alert className="mt-4">{error}</Alert>}

      {fileMeta && (
        <Card className="mt-5 flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-background text-lg">
              📄
            </div>
            <div>
              <div className="text-[13.5px] font-semibold text-foreground">{fileMeta.name}</div>
              <div className="mt-0.5 text-xs text-muted">
                {(fileMeta.sizeBytes / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          </div>
          {job && (
            <StatusPill tone={STATUS_TONE[job.status]}>
              {job.status === "pending" || job.status === "processing" ? (
                <span className="text-shimmer font-semibold">{STATUS_LABEL[job.status]}</span>
              ) : (
                STATUS_LABEL[job.status]
              )}
            </StatusPill>
          )}
          {busy && !job && (
            <StatusPill tone="accent">
              <span className="text-shimmer font-semibold">Uploading…</span>
            </StatusPill>
          )}
        </Card>
      )}

      {job?.status === "failed" && (
        <div className="mt-3.5 flex items-center justify-between gap-3.5 rounded-[10px] bg-danger-bg px-4 py-3.5 animate-fade-slide-in">
          <span className="text-[12.5px] font-semibold text-danger-fg">
            {job.error_message ?? "Could not extract text."}
          </span>
          <button
            type="button"
            onClick={onRetry}
            disabled={busy}
            className="shrink-0 rounded-[7px] border border-danger-fg/30 bg-surface-strong px-3.5 py-1.5 text-xs font-semibold text-danger-fg disabled:opacity-60"
          >
            Retry parsing
          </button>
        </div>
      )}

      {job?.status === "parsed" && (
        <>
          <p className="mt-3.5 text-[12.5px] text-success-fg animate-fade-slide-in">
            Parsed successfully — review what we found below before adding anything to your
            profile.
          </p>
          {job.parsed_json && <CvParsedReview parsed={job.parsed_json} />}
        </>
      )}
    </div>
  );
}
