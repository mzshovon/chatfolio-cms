"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { StatusPill } from "@/components/ui/status-pill";
import { ApiError } from "@/lib/api/http";
import * as portfolioApi from "@/lib/api/portfolio-settings";
import * as profileApi from "@/lib/api/profile";
import * as sectionsApi from "@/lib/api/sections";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useEffect, useState } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your changes.");
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

  const checklist = [
    { label: "Full name set", done: nameSet },
    { label: `Sections approved (${approvedCount} of ${totalSections})`, done: approvedCount >= totalSections },
  ];
  const fieldClass =
    "flex-1 rounded-[9px] border border-border bg-surface-strong px-3.5 py-3 text-[13.5px] text-foreground outline-none focus:border-accent";

  return (
    <div className="mx-auto max-w-[720px] p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[22px] font-semibold text-foreground">
            Publish your chatfolio
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Control your public link and go live for recruiters.
          </p>
        </div>
        <StatusPill tone={settings.is_published ? "success" : "neutral"}>
          {settings.is_published ? "Live" : "Not published"}
        </StatusPill>
      </div>

      {error && <Alert className="mt-4">{error}</Alert>}

      <Card className="mt-5 flex flex-col gap-4">
        <div>
          <div className="mb-1.5 text-xs text-muted">Your chatfolio URL</div>
          <div className="flex gap-2.5">
            <input
              value={slugDraft}
              onChange={(e) => setSlugDraft(e.target.value.toLowerCase())}
              className={fieldClass}
            />
            <button
              type="button"
              onClick={onCopyLink}
              className="shrink-0 rounded-[9px] border border-border bg-surface-strong px-4 text-[13px] font-semibold text-foreground"
            >
              {copyLabel}
            </button>
          </div>
          <div className="mt-1.5 text-xs text-muted">{slugDraft}.chatfolio.com</div>
        </div>
        {settings.previous_slug && (
          <div className="text-xs text-muted">
            Your old link ({settings.previous_slug}.chatfolio.com) will keep redirecting here.
          </div>
        )}

        <div className="h-px bg-border" />

        <div>
          <div className="mb-1.5 text-xs text-muted">Contact call-to-action</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.4fr]">
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
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-foreground">
          <input
            type="checkbox"
            checked={cvDownloadable}
            onChange={(e) => setCvDownloadable(e.target.checked)}
            className="accent-accent"
          />
          Allow recruiters to download your CV
        </label>

        <button
          type="button"
          onClick={onSaveSettings}
          disabled={saving}
          className="self-start rounded-[9px] bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </Card>

      <Card className="mt-4">
        <span className="text-[13.5px] font-semibold text-foreground">Publish checklist</span>
        <div className="mt-3.5 flex flex-col gap-2.5">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-[13px]">
              <span
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] ${
                  item.done ? "bg-success-bg text-success-fg" : "bg-danger-bg text-danger-fg"
                }`}
              >
                {item.done ? "✓" : "!"}
              </span>
              <span className={item.done ? "text-foreground" : "text-muted"}>{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {publishError && <Alert className="mt-3.5">{publishError}</Alert>}

      <div className="mt-5 flex gap-2.5">
        {settings.is_published ? (
          <button
            type="button"
            onClick={onUnpublish}
            disabled={publishing}
            className="rounded-[10px] border border-danger-fg/30 bg-surface-strong px-5 py-3 text-[13.5px] font-semibold text-danger-fg disabled:opacity-60"
          >
            {publishing ? "Unpublishing…" : "Unpublish"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing}
            className="rounded-[10px] bg-accent px-5 py-3 text-[13.5px] font-semibold text-accent-foreground disabled:opacity-60"
          >
            {publishing ? "Publishing…" : "Publish chatfolio"}
          </button>
        )}
      </div>
    </div>
  );
}
