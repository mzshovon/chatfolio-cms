"use client";

import { Alert } from "@/components/ui/alert";
import { StatusPill } from "@/components/ui/status-pill";
import { CvParsedReview } from "@/components/dashboard/cv-parsed-review";
import * as cvApi from "@/lib/api/cv";
import { ApiError } from "@/lib/api/http";
import { cn } from "@/lib/cn";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { setCvUploadedFlag } from "@/lib/onboarding";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;
const POLL_INTERVAL_MS = 3000;

const STAGES = ["Uploading file", "Reading text", "Finding sections", "Building AI knowledge"];
const DOC_LINES = [
  ["88%", "72%", "64%"],
  ["92%", "80%", "86%", "60%"],
  ["78%", "58%"],
  ["84%", "66%"],
  ["90%", "70%"],
  ["74%", "52%"],
];

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

  const reset = () => {
    setJob(null);
    setFileMeta(null);
    setError(null);
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  };

  const handleFile = async (file: File) => {
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

  const parsed = job?.status === "parsed" ? job.parsed_json : null;
  const scanning = busy && !job ? true : job?.status === "pending" || job?.status === "processing";
  const dragProps = {
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
  };
  // Stages follow the real job status: nothing is faked ahead of the backend.
  const stage = !job ? 0 : job.status === "pending" ? 1 : job.status === "processing" ? 2 : 3;
  const found = parsed
    ? [
        parsed.full_name || parsed.title || parsed.bio ? "Profile" : null,
        parsed.experience.length ? "Experience" : null,
        parsed.skills.length ? "Skills" : null,
        parsed.education.length ? "Education" : null,
        parsed.projects.length ? "Projects" : null,
      ].filter((x): x is string => Boolean(x))
    : [];

  return (
    <div className="mx-auto max-w-[1100px] p-7">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={onFileSelected}
      />
      <h1 className="font-serif text-2xl font-semibold text-foreground">Your CV</h1>
      <p className="mt-1 text-[13.5px] text-muted">
        Upload a PDF or Word file. We read it and turn it into knowledge your chatfolio answers from.
      </p>

      {error && <Alert className="mt-4">{error}</Alert>}

      {!job && !scanning && (
        <div
          onClick={triggerUpload}
          {...dragProps}
          className="mt-5 cursor-pointer rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-12 text-center hover:border-accent hover:bg-accent-tint/30"
        >
          <div className="relative mx-auto h-16 w-[52px] rounded-md border border-border bg-surface-strong shadow-[0_8px_20px_-10px_rgba(0,0,0,.2)]">
            <div className="absolute left-[9px] right-[9px] top-3 h-1 rounded-sm bg-accent" />
            <div className="absolute left-[9px] right-4 top-[22px] h-[3px] rounded-sm bg-border" />
            <div className="absolute left-[9px] right-3 top-[30px] h-[3px] rounded-sm bg-border" />
            <div className="absolute left-[9px] right-5 top-[38px] h-[3px] rounded-sm bg-border" />
          </div>
          <div className="mt-4 text-[15px] font-semibold text-foreground">Drop your CV here, or click to browse</div>
          <div className="mt-1 text-[12.5px] text-muted">PDF, DOC or DOCX · up to 20 MB</div>
        </div>
      )}

      {scanning && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-9 rounded-2xl border border-border bg-surface-strong p-7">
          <div className="relative h-[330px] w-[250px] shrink-0 overflow-hidden rounded-[10px] border border-border bg-background px-5 py-[22px] shadow-[0_20px_40px_-24px_rgba(60,40,10,.35)]">
            <div className="flex items-center gap-2.5">
              <div className="h-[34px] w-[34px] rounded-full bg-border" />
              <div className="flex-1">
                <div className="h-2 w-[70%] rounded-[3px] bg-foreground" />
                <div className="mt-1.5 h-[5px] w-1/2 rounded-[3px] bg-border" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-[9px]">
              {DOC_LINES.map((lines, i) => (
                <div
                  key={i}
                  className={cn(
                    "-mx-[5px] rounded-[5px] px-[5px] py-1 transition-colors duration-300",
                    i < stage * 2 && "bg-accent/10 outline outline-1 outline-accent/35"
                  )}
                >
                  <div className={cn("h-[5px] w-1/3 rounded-[3px]", i < stage * 2 ? "bg-accent" : "bg-muted-subtle/60")} />
                  {lines.map((w, k) => (
                    <div key={k} className="mt-1 h-[3.5px] rounded-sm bg-border" style={{ width: w }} />
                  ))}
                </div>
              ))}
            </div>
            <div className="animate-cv-scan pointer-events-none absolute inset-x-0 h-12">
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-accent shadow-[0_0_12px_2px_rgba(200,134,46,.7)]" />
              <div className="absolute inset-0 bg-gradient-to-b from-accent/0 to-accent/15" />
            </div>
          </div>

          <div className="min-w-[260px] max-w-[420px] flex-1">
            <div className="text-xs font-bold tracking-[0.14em] text-accent">SCANNING</div>
            <div className="mt-1.5 font-serif text-[22px] font-semibold text-foreground">{STAGES[stage]}…</div>
            <div className="mt-1 text-[13px] text-muted">{fileMeta?.name}</div>
            <div className="mt-5 flex flex-col gap-2.5">
              {STAGES.map((label, i) => (
                <div
                  key={label}
                  className={cn("flex items-center gap-2.5 text-[13.5px]", i > stage ? "text-muted-subtle" : "text-foreground")}
                >
                  {i < stage ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-fg text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : i === stage ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent-tint border-t-accent" />
                  ) : (
                    <span className="h-5 w-5 rounded-full border-2 border-border" />
                  )}
                  <span className={i === stage ? "font-semibold" : ""}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {job?.status === "failed" && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3.5 rounded-xl bg-danger-bg px-4 py-3.5 animate-fade-slide-in">
          <span className="text-[13px] font-semibold text-danger-fg">
            {job.error_message ?? "Could not extract text."}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRetry}
              disabled={busy}
              className="shrink-0 rounded-[7px] border border-danger-fg/30 bg-surface-strong px-3.5 py-1.5 text-xs font-semibold text-danger-fg disabled:opacity-60"
            >
              Retry parsing
            </button>
            <button
              type="button"
              onClick={reset}
              className="shrink-0 rounded-[7px] border border-border bg-surface-strong px-3.5 py-1.5 text-xs font-semibold text-foreground"
            >
              Upload a different file
            </button>
          </div>
        </div>
      )}

      {job?.status === "parsed" && (
        <div className="mt-5 flex flex-col gap-4 animate-fade-slide-in">
          <div className="rounded-2xl border border-border bg-surface-strong p-5">
            <div className="flex flex-wrap items-center gap-3.5">
              <div className="flex h-[52px] w-[42px] items-end justify-center rounded-[5px] border border-border bg-background pb-1.5 text-[9px] font-bold uppercase text-flag">
                {job.file_type}
              </div>
              <div className="min-w-[160px] flex-1">
                <div className="text-sm font-semibold text-foreground">{fileMeta?.name ?? "Your CV"}</div>
                <div className="mt-0.5 text-[12.5px] text-muted">
                  {(job.size_bytes / 1024 / 1024).toFixed(1)} MB · {found.length} sections found
                </div>
              </div>
              <StatusPill tone="success">Ready</StatusPill>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-border bg-surface-strong px-3.5 py-2 text-[13px] font-semibold text-foreground"
              >
                Upload new CV
              </button>
            </div>
            {parsed && (
              <div className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5">
                {[
                  ["Experience", parsed.experience.length],
                  ["Skills found", parsed.skills.length],
                  ["Projects", parsed.projects.length],
                  ["Education", parsed.education.length],
                ].map(([label, count]) => (
                  <div key={label} className="rounded-[10px] bg-background p-3">
                    <div className="text-xs text-muted">{label}</div>
                    <div className="mt-0.5 font-serif text-[22px] font-semibold text-foreground">{count}</div>
                  </div>
                ))}
              </div>
            )}
            {found.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {found.map((f) => (
                  <span key={f} className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-semibold text-success-fg">
                    ✓ {f}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-4 text-[13px] leading-normal text-muted">
              Review what we found below before adding anything to your profile.
            </p>
          </div>
          {parsed && <CvParsedReview parsed={parsed} />}
        </div>
      )}
    </div>
  );
}
