"use client";

import { Alert } from "@/components/ui/alert";
import { SavedFlash } from "@/components/ui/saved-flash";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/http";
import * as portfolioApi from "@/lib/api/portfolio-settings";
import * as profileApi from "@/lib/api/profile";
import * as sectionsApi from "@/lib/api/sections";
import { cn } from "@/lib/cn";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useSaveFlash } from "@/lib/hooks/use-save-flash";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const META: Record<sectionsApi.SectionType, { title: string; hint: string; ideal: string; rows: number }> = {
  intro: {
    title: "Intro",
    hint: "Shown at the top of your chatfolio. Keep it to 2–3 sentences.",
    ideal: "ideal 200–400",
    rows: 4,
  },
  summary: {
    title: "Summary",
    hint: "The AI uses this for detailed answers. Include results, tools and education.",
    ideal: "ideal 500–1,200",
    rows: 7,
  },
};

export default function PortfolioSectionsPage() {
  const authed = useAuthedRequest();
  const [sections, setSections] = useState<sectionsApi.PortfolioSection[]>([]);
  // Last server-side content per section, to tell unsaved edits from saved ones.
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<profileApi.Profile | null>(null);
  const [settings, setSettings] = useState<portfolioApi.PortfolioSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<{ id: string; action: "regen" | "save" | "approve" } | null>(null);
  const savedFlash = useSaveFlash();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, prof, portfolio] = await Promise.all([
          authed((token) => sectionsApi.getSections(token)),
          authed((token) => profileApi.getProfile(token)),
          authed((token) => portfolioApi.getPortfolioSettings(token)),
        ]);
        if (cancelled) return;
        setSections(data);
        setSaved(Object.fromEntries(data.map((s) => [s.id, s.content])));
        setProfile(prof);
        setSettings(portfolio);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load your sections.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replace = (updated: sectionsApi.PortfolioSection) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSaved((prev) => ({ ...prev, [updated.id]: updated.content }));
  };

  const onContentChange = (id: string, content: string) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)));

  const run = async (
    id: string,
    action: "regen" | "save" | "approve",
    fn: (token: string) => Promise<sectionsApi.PortfolioSection>,
    failure: string
  ) => {
    setBusy({ id, action });
    setError(null);
    try {
      replace(await authed(fn));
      if (action === "save") savedFlash.flash(id);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 429
            ? "You've regenerated this a lot recently — try again in a bit."
            : err.message
          : failure
      );
    } finally {
      setBusy(null);
    }
  };

  const onApprove = async (section: sectionsApi.PortfolioSection, dirty: boolean) => {
    setBusy({ id: section.id, action: "approve" });
    setError(null);
    try {
      // An edited draft is saved first, then approved (a manual edit always resets to draft).
      const base = dirty
        ? await authed((token) => sectionsApi.updateSection(token, section.id, section.content))
        : section;
      replace(await authed((token) => sectionsApi.approveSection(token, base.id)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't approve this section.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const approvedCount = sections.filter((s) => s.status === "approved" && s.content === saved[s.id]).length;
  const sectionsApproved = sections.length > 0 && approvedCount === sections.length;
  const nameSet = Boolean(profile?.full_name);
  const ready = sectionsApproved && nameSet;
  const intro = sections.find((s) => s.section_type === "intro");
  const firstName = profile?.full_name?.split(/\s+/)[0];

  const readiness = [
    { label: "Intro and Summary approved", done: sectionsApproved },
    { label: "Full name set", done: nameSet },
  ];

  return (
    <div className="flex flex-wrap items-start gap-5 p-7">
      <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-[18px]">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">AI-generated sections</h1>
          <p className="mt-1 text-[13.5px] text-muted">
            These ground what your chatfolio says about you. Both must be approved before you can publish.
          </p>
        </div>

        {error && <Alert>{error}</Alert>}

        {sections.map((section) => {
          const meta = META[section.section_type];
          const dirty = section.content !== saved[section.id];
          const approved = section.status === "approved" && !dirty;
          const regenerating = busy?.id === section.id && busy.action === "regen";
          const saving = busy?.id === section.id && busy.action === "save";
          const approving = busy?.id === section.id && busy.action === "approve";
          const working = busy?.id === section.id;
          const badge = regenerating ? "Regenerating" : dirty ? "Edited · not saved" : approved ? "Approved" : "Needs approval";
          return (
            <div
              key={section.id}
              className={cn(
                "overflow-hidden rounded-2xl border bg-surface-strong",
                approved ? "border-border" : "border-accent/40"
              )}
            >
              <div className="flex flex-wrap items-center gap-3 px-[22px] pt-[18px]">
                <div className="min-w-[180px] flex-1">
                  <div className="text-base font-semibold text-foreground">{meta.title}</div>
                  <div className="mt-0.5 text-[12.5px] text-muted">{meta.hint}</div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    approved ? "bg-success-bg text-success-fg" : "bg-accent-tint text-accent"
                  )}
                >
                  {badge}
                </span>
              </div>

              <div className="relative px-[22px] pt-3.5">
                <textarea
                  rows={meta.rows}
                  value={section.content}
                  disabled={regenerating}
                  onChange={(e) => onContentChange(section.id, e.target.value)}
                  className={cn(
                    "block w-full resize-y rounded-xl border border-border bg-background px-4 py-3.5 text-[14.5px] leading-[1.65] text-foreground outline-none focus:border-accent",
                    regenerating && "opacity-25"
                  )}
                />
                {regenerating && (
                  <div className="absolute inset-x-[22px] inset-y-0 top-3.5 flex items-center justify-center gap-2.5 text-[13px] font-semibold text-accent">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-tint border-t-accent" />
                    Writing a new version from your CV…
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-between gap-2.5 px-[22px] pt-2.5 text-xs text-muted">
                <span>
                  {section.content.length.toLocaleString()} characters · {meta.ideal}
                </span>
                {dirty && <span className="font-semibold text-accent">Unsaved edits</span>}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-border bg-background/60 px-[22px] py-3">
                <span className="mr-auto text-[12.5px] text-muted">
                  Version <b className="text-foreground">{section.version}</b> ·{" "}
                  {section.generated_by === "ai" ? "Generated by AI" : "Edited by you"}
                </span>
                <SavedFlash state={savedFlash.get(section.id)} />
                <button
                  type="button"
                  onClick={() =>
                    run(section.id, "regen", (t) => sectionsApi.regenerateSection(t, section.id), "Couldn't regenerate this section. Try again shortly.")
                  }
                  disabled={working}
                  className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-tint px-3 py-2 text-[13px] font-semibold text-accent disabled:opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {regenerating ? "Regenerating…" : "Regenerate"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    run(section.id, "save", (t) => sectionsApi.updateSection(t, section.id, section.content), "Couldn't save your edit.")
                  }
                  disabled={working || !dirty}
                  className="rounded-lg border border-border bg-surface-strong px-3 py-2 text-[13px] font-semibold text-foreground disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save edit"}
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(section, dirty)}
                  disabled={working || approved}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-[13px] font-semibold disabled:cursor-default",
                    approved ? "bg-success-bg text-success-fg" : "bg-foreground text-background disabled:opacity-60"
                  )}
                >
                  {approving ? "Approving…" : approved ? "✓ Approved" : dirty ? "Save & approve" : "Approve"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <aside className="flex min-w-[280px] flex-[0_1_340px] flex-col gap-[18px] lg:sticky lg:top-5">
        <div className="rounded-2xl bg-brand-bg p-5 text-brand-fg">
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-[14.5px] font-semibold">Publish readiness</span>
            <span className={cn("text-xs font-bold", ready ? "text-[#7fd3a0]" : "text-[#f2c27a]")}>
              {ready ? "READY" : `${readiness.filter((r) => r.done).length} of ${readiness.length}`}
            </span>
          </div>
          <div className="mt-3.5 flex flex-col gap-2.5">
            {readiness.map((r) => (
              <div key={r.label} className="flex items-center gap-2.5 text-[13px]">
                <span
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                    r.done ? "bg-[#2e6a3d] text-white" : "border-2 border-brand-border"
                  )}
                >
                  {r.done && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className={r.done ? "text-brand-fg" : "text-brand-muted"}>{r.label}</span>
              </div>
            ))}
          </div>
          <Link
            href={ready ? "/dashboard/publish" : nameSet ? "/dashboard/sections" : "/dashboard/profile"}
            className={cn(
              "mt-4 block w-full rounded-[9px] p-[11px] text-center text-[13.5px] font-semibold text-white",
              ready ? "bg-accent hover:bg-accent-hover" : "bg-brand-border"
            )}
          >
            {ready
              ? settings?.is_published
                ? "View publish settings"
                : "Go to Publish"
              : !nameSet
                ? "Add your name first"
                : "Approve both sections to publish"}
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-surface-strong p-[18px]">
          <div className="text-xs font-bold tracking-[0.1em] text-muted">HOW RECRUITERS SEE IT</div>
          <div className="mt-3 rounded-xl border border-border bg-background p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand-bg text-xs font-bold text-brand-accent">
                {(profile?.full_name ?? "?")
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-foreground">{profile?.full_name ?? "Your name"}</div>
                <div className="truncate text-[11.5px] text-muted">{settings?.subdomain}</div>
              </div>
            </div>
            <div className="mt-3 line-clamp-5 text-[13px] leading-relaxed text-foreground/80">
              {intro?.content || "Your intro appears here."}
            </div>
            <div className="mt-3 inline-block rounded-xl rounded-bl bg-surface px-[11px] py-2 text-[12.5px] text-foreground">
              Hi! Ask me anything about {firstName ? `${firstName}'s` : "my"} experience.
            </div>
          </div>
          <p className="mt-2.5 text-xs leading-normal text-muted">
            The Intro is shown on your page. The Summary is what the AI draws on for detailed answers.
          </p>
        </div>
      </aside>
    </div>
  );
}
