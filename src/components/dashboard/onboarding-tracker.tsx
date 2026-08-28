"use client";

import * as portfolioApi from "@/lib/api/portfolio-settings";
import * as sectionsApi from "@/lib/api/sections";
import { cn } from "@/lib/cn";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import {
  getCvUploadedFlag,
  getTrackerOpenPreference,
  setTrackerOpenPreference,
} from "@/lib/onboarding";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

// A candidate's slug starts as this auto-generated pattern (Docs §6) until
// they choose their own — used as a cheap "have they touched publish
// settings yet" signal without a dedicated backend flag for it.
const DEFAULT_SLUG_PATTERN = /^candidate-[a-z0-9]+$/;

type Step = {
  id: string;
  label: string;
  href: string;
  action: string;
  done: boolean;
};

export function OnboardingTracker() {
  const authed = useAuthedRequest();
  const pathname = usePathname();

  // Same SSR-mismatch-avoidance reasoning as OnboardingTutorial: the server
  // snapshot is always "open" (the template's own default), and an explicit
  // user toggle overrides it locally without needing an effect.
  const storedOpen = useSyncExternalStore(
    noopSubscribe,
    () => getTrackerOpenPreference(true),
    () => true
  );
  const [openOverride, setOpenOverride] = useState<boolean | null>(null);
  const open = openOverride ?? storedOpen;
  const [steps, setSteps] = useState<Step[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sections, settings] = await Promise.all([
          authed((token) => sectionsApi.getSections(token)),
          authed((token) => portfolioApi.getPortfolioSettings(token)),
        ]);
        if (cancelled) return;
        const sectionsApproved =
          sections.length > 0 && sections.every((s) => s.status === "approved");
        const slugCustomized = !DEFAULT_SLUG_PATTERN.test(settings.slug);
        setSteps([
          {
            id: "cv",
            label: "Upload your CV",
            href: "/dashboard/cv",
            action: "Upload",
            done: getCvUploadedFlag(),
          },
          {
            id: "sections",
            label: "Approve AI intro & summary",
            href: "/dashboard/sections",
            action: "Review",
            done: sectionsApproved,
          },
          {
            id: "slug",
            label: "Set your publish slug",
            href: "/dashboard/publish",
            action: "Set up",
            done: slugCustomized,
          },
          {
            id: "publish",
            label: "Publish your chatfolio",
            href: "/dashboard/publish",
            action: "Publish",
            done: settings.is_published,
          },
        ]);
      } catch {
        // Best-effort nudge widget — a failed fetch here shouldn't surface a
        // dashboard-wide error, it should just not render this run.
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-checks on every navigation so completing a step on one page (e.g.
    // approving a section) is reflected the next time this renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!steps) return null;

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const progressLabel = `${doneCount} of ${steps.length} steps done`;

  const toggle = (next: boolean) => {
    setOpenOverride(next);
    setTrackerOpenPreference(next);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => toggle(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-accent px-4.5 py-3 text-[12.5px] font-semibold text-accent-foreground shadow-lg hover:bg-accent-hover"
      >
        🚀 {progressLabel}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[270px] rounded-2xl border border-border bg-surface-strong p-4.5 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-foreground">Get chatfolio-ready</span>
        <button
          type="button"
          onClick={() => toggle(false)}
          className="text-[13px] text-muted hover:text-foreground"
        >
          ✕
        </button>
      </div>
      <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 text-[11px] text-muted">{progressLabel}</div>
      <div className="mt-3.5 flex flex-col gap-2">
        {steps.map((s) => (
          <Link
            key={s.id}
            href={s.href}
            className="flex items-center gap-2.5 text-[12.5px] text-foreground hover:text-accent"
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]",
                s.done ? "bg-success-bg text-success-fg" : "border border-border text-muted"
              )}
            >
              {s.done ? "✓" : ""}
            </span>
            <span className="flex-1">{s.label}</span>
            {!s.done && <span className="text-[11px] text-muted">{s.action}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
