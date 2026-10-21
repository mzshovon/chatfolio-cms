"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { SavedFlash } from "@/components/ui/saved-flash";
import { Spinner } from "@/components/ui/spinner";
import { StatusPill } from "@/components/ui/status-pill";
import { ApiError } from "@/lib/api/http";
import * as portfolioApi from "@/lib/api/portfolio-settings";
import * as profileApi from "@/lib/api/profile";
import * as sectionsApi from "@/lib/api/sections";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useSaveFlash } from "@/lib/hooks/use-save-flash";
import { cn } from "@/lib/cn";
import { AlertCircle, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Matches the backend's slug validation exactly (Docs §6): lowercase
// letters, digits, and hyphens only, 3-63 chars, can't start or end with a
// hyphen. Checking this client-side means the friendly message below is
// what candidates actually see — the backend's own 422 for the same rule
// is a raw regex in its `msg` field, not something to show as-is.
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;

function slugValidationError(slug: string): string | null {
  if (!slug) return "Enter a URL slug.";
  if (slug.length < 3) return "Slug must be at least 3 characters.";
  if (!SLUG_PATTERN.test(slug)) {
    return "Slug can only contain lowercase letters, numbers, and hyphens — no spaces, underscores, or other symbols, and it can't start or end with a hyphen.";
  }
  return null;
}

export default function PublishSettingsPage() {
  const authed = useAuthedRequest();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<portfolioApi.PortfolioSettings | null>(null);
  const [nameSet, setNameSet] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);
  const [totalSections, setTotalSections] = useState(2);

  const [slugDraft, setSlugDraft] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [cvDownloadable, setCvDownloadable] = useState(true);

  const [copyLabel, setCopyLabel] = useState("Copy link");
  const [postLabel, setPostLabel] = useState("Copy post");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savedFlash = useSaveFlash();
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [portfolio, profile, sections] = await Promise.all([
          authed((token) => portfolioApi.getPortfolioSettings(token)),
          authed((token) => profileApi.getProfile(token)),
          authed((token) => sectionsApi.getSections(token)),
        ]);
        if (cancelled) return;
        setSettings(portfolio);
        setSlugDraft(portfolio.slug);
        setCtaLabel(portfolio.contact_cta_config.label ?? "");
        setCtaUrl(portfolio.contact_cta_config.url ?? "");
        setCvDownloadable(portfolio.cv_downloadable);
        setNameSet(Boolean(profile.full_name));
        setTotalSections(sections.length);
        setApprovedCount(sections.filter((s) => s.status === "approved").length);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load your settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSaveSettings = async () => {
    const validationError = slugValidationError(slugDraft);
    if (validationError) {
      setSlugError(validationError);
      return;
    }
    setSlugError(null);
    setSaving(true);
    setError(null);
    try {
      const updated = await authed((token) =>
        portfolioApi.updatePortfolioSettings(token, {
          slug: slugDraft.toLowerCase(),
          contact_cta_config: { label: ctaLabel || undefined, url: ctaUrl || undefined },
          cv_downloadable: cvDownloadable,
        })
      );
      setSettings(updated);
      setSlugDraft(updated.slug);
      savedFlash.flash("settings");
    } catch (err) {
      if (err instanceof ApiError) {
        // Defensive fallback in case the backend ever rejects a slug our
        // own slugValidationError missed (e.g. a rule it enforces that this
        // client-side copy doesn't yet) — swap its raw "slug: String should
        // match pattern '...'" for the same friendly copy shown above,
        // rather than exposing the regex.
        if (err.status === 422 && /^slug:/.test(err.message)) {
          setError(null);
          setSlugError(
            "Slug can only contain lowercase letters, numbers, and hyphens — no spaces, underscores, or other symbols, and it can't start or end with a hyphen."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Couldn't save your changes.");
      }
    } finally {
      setSaving(false);
    }
  };

  const onCopyLink = async () => {
    if (!settings) return;
    try {
      await navigator.clipboard.writeText(`https://${settings.subdomain}`);
      setCopyLabel("Copied!");
    } catch {
      setCopyLabel("Copy failed");
    }
    setTimeout(() => setCopyLabel("Copy link"), 1500);
  };

  const onPublish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const updated = await authed((token) => portfolioApi.publishPortfolio(token));
      setSettings(updated);
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : "Couldn't publish right now.");
    } finally {
      setPublishing(false);
    }
  };

  const onUnpublish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const updated = await authed((token) => portfolioApi.unpublishPortfolio(token));
      setSettings(updated);
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : "Couldn't unpublish right now.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const sectionsReady = totalSections > 0 && approvedCount >= totalSections;
  const checklist = [
    { label: "Full name set", done: nameSet, cta: "Add name", href: "/dashboard/profile" },
    {
      label: `Sections approved (${approvedCount} of ${totalSections})`,
      done: sectionsReady,
      cta: "Review",
      href: "/dashboard/sections",
    },
  ];
  const ready = checklist.every((c) => c.done);
  const publicUrl = `https://${settings.subdomain}`;
  const postText = `I've turned my CV into an AI portfolio. Recruiters can ask it about my experience, projects and availability anytime: ${publicUrl}`;
  const fieldClass =
    "flex-1 rounded-[9px] border border-border bg-surface-strong px-3.5 py-3 text-[13.5px] text-foreground outline-none focus:border-accent";
  const live = settings.is_published;
  const statusColor = live ? "text-[#7fd3a0]" : "text-[#f2c27a]";
  const statusDot = live ? "bg-[#3fae6a]" : "bg-brand-accent";

  const onCopyPost = async () => {
    try {
      await navigator.clipboard.writeText(postText);
      setPostLabel("Copied!");
    } catch {
      setPostLabel("Copy failed");
    }
    setTimeout(() => setPostLabel("Copy post"), 1500);
  };

  return (
    <div className="flex flex-wrap items-start gap-5 p-7">
      <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-[18px]">
        {error && <Alert>{error}</Alert>}

        <div className="rounded-2xl bg-brand-bg p-6 text-brand-fg">
          <div className="flex flex-wrap items-center justify-between gap-3.5">
            <span className={cn("flex items-center gap-2 text-xs font-bold tracking-[0.12em]", statusColor)}>
              <span className={cn("h-2 w-2 rounded-full", statusDot)} />
              {live ? "LIVE" : "NOT PUBLISHED"}
            </span>
            {live ? (
              <button
                type="button"
                onClick={onUnpublish}
                disabled={publishing}
                className="rounded-[9px] border border-brand-border px-4 py-2 text-[13px] font-semibold hover:bg-white/5 disabled:opacity-60"
              >
                {publishing ? "Unpublishing…" : "Unpublish"}
              </button>
            ) : (
              <button
                type="button"
                onClick={onPublish}
                disabled={publishing || !ready}
                className="rounded-[9px] bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
              >
                {publishing ? "Publishing…" : "Publish chatfolio"}
              </button>
            )}
          </div>
          <div className="mt-4 break-all font-mono text-[clamp(20px,3vw,28px)] font-semibold">{settings.subdomain}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopyLink}
              className="rounded-lg border border-brand-border px-3 py-2 text-[12.5px] font-semibold hover:bg-white/5"
            >
              {copyLabel}
            </button>
            {live && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-brand-border px-3 py-2 text-[12.5px] font-semibold hover:bg-white/5"
              >
                Open ↗
              </a>
            )}
          </div>
          {!live && !ready && (
            <div className="mt-3.5 text-[13px] text-[#f2c27a]">Finish the checklist below before publishing.</div>
          )}
          {publishError && <div className="mt-3.5 text-[13px] text-[#f2a894]">{publishError}</div>}
        </div>

        <Card className="bg-surface-strong p-5 sm:p-[22px]">
          <div className="text-[15px] font-semibold text-foreground">Your link</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <div
              className={cn(
                "flex min-w-[240px] flex-1 items-center overflow-hidden rounded-[10px] border-[1.5px] bg-background",
                slugError ? "border-danger-fg/50" : "border-border"
              )}
            >
              <input
                value={slugDraft}
                onChange={(e) => {
                  setSlugDraft(e.target.value.toLowerCase());
                  setSlugError(null);
                }}
                className="min-w-0 flex-1 bg-transparent px-3 py-[11px] font-mono text-[14.5px] font-semibold text-foreground outline-none"
              />
              <span className="px-3 font-mono text-sm text-muted">.chatfolio.chat</span>
            </div>
            <button
              type="button"
              onClick={onSaveSettings}
              disabled={saving}
              className="min-h-[44px] rounded-[10px] bg-foreground px-[18px] text-[13.5px] font-semibold text-background disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
          <div className={cn("mt-2 text-[12.5px]", slugError ? "text-danger-fg" : "text-muted")}>
            {slugError ??
              (settings.previous_slug
                ? `Your old link (${settings.previous_slug}.chatfolio.chat) will keep redirecting here.`
                : "Renaming later is safe — your old link keeps working.")}
          </div>
          <div className="mt-2 flex justify-end">
            <SavedFlash state={savedFlash.get("settings")} />
          </div>
        </Card>

        <Card className="bg-surface-strong p-5 sm:p-[22px]">
          <div className="text-[15px] font-semibold text-foreground">Contact button &amp; CV</div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.4fr]">
            <input
              placeholder="Button label"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className={fieldClass}
            />
            <input
              placeholder="Link (e.g. mailto:you@example.com)"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className={fieldClass}
            />
          </div>
          <label className="mt-3.5 flex cursor-pointer items-center gap-2.5 text-[13px] text-foreground">
            <input
              type="checkbox"
              checked={cvDownloadable}
              onChange={(e) => setCvDownloadable(e.target.checked)}
              className="accent-accent"
            />
            Allow recruiters to download your CV
          </label>
          <div className="mt-3.5 flex justify-end">
            <button
              type="button"
              onClick={onSaveSettings}
              disabled={saving}
              className="rounded-[9px] bg-foreground px-4 py-2 text-[13px] font-semibold text-background disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </Card>

        <Card className="bg-surface-strong p-5 sm:p-[22px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[15px] font-semibold text-foreground">Custom domains</div>
              <div className="text-[12.5px] text-muted">Use your own domain for your chatfolio.</div>
            </div>
            <StatusPill tone="neutral">Coming soon</StatusPill>
          </div>
        </Card>

        <Card className="bg-surface-strong p-5 sm:p-[22px]">
          <div className="text-[15px] font-semibold text-foreground">Publish checklist</div>
          <div className="mt-3 flex flex-col gap-2.5">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 text-[13.5px]">
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    item.done ? "bg-success-bg text-success-fg" : "border border-border text-muted-subtle"
                  )}
                >
                  {item.done ? (
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  ) : (
                    <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
                  )}
                </span>
                <span className={cn("flex-1", item.done ? "text-foreground" : "text-muted")}>{item.label}</span>
                {!item.done && (
                  <Link href={item.href} className="text-xs font-semibold text-accent hover:text-accent-hover">
                    {item.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <aside className="flex min-w-[280px] flex-[0_1_330px] flex-col gap-4 rounded-2xl border border-border bg-surface-strong p-5 lg:sticky lg:top-5">
        <div>
          <div className="text-[14.5px] font-semibold text-foreground">Share kit</div>
          <div className="mt-0.5 text-[12.5px] text-muted">Put your link where recruiters look.</div>
        </div>
        <a
          href={live ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!live}
          className={cn(
            "rounded-[10px] bg-[#0a66c2] p-[11px] text-center text-[13.5px] font-semibold text-white",
            !live && "pointer-events-none opacity-50"
          )}
        >
          Share on LinkedIn
        </a>
        <div className="rounded-xl border border-border p-3.5">
          <div className="text-xs font-bold tracking-[0.1em] text-muted">READY-MADE POST</div>
          <div className="mt-2 text-[13px] leading-relaxed text-foreground/80">{postText}</div>
          <button
            type="button"
            onClick={onCopyPost}
            className="mt-2.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-foreground"
          >
            {postLabel}
          </button>
        </div>
        {!live && <p className="text-xs text-muted">Publish first — the link only works once your chatfolio is live.</p>}
      </aside>
    </div>
  );
}
