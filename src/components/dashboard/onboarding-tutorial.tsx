"use client";

import { cn } from "@/lib/cn";
import { hasSeenOnboarding, markOnboardingSeen } from "@/lib/onboarding";
import { useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

const STEPS = [
  {
    title: "Welcome to Chatfolio",
    body: "This is your dashboard — a quick look at how your chatfolio is performing. Let's walk through the four steps to get it live.",
  },
  {
    title: "1. Upload your CV",
    body: "Upload your CV and we auto-parse it into experience, projects, skills, and education. You can edit any of it afterward.",
  },
  {
    title: "2. Approve your AI voice",
    body: "Review the intro and summary the AI will use when it speaks to recruiters on your behalf. Nothing goes live until you approve it.",
  },
  {
    title: "3. Publish and share",
    body: "Once your checklist is complete, publish your chatfolio and share the link — recruiters can chat with it directly, any time.",
  },
];

export function OnboardingTutorial() {
  // useSyncExternalStore (rather than useState+useEffect) so the very first
  // client render already matches what SSR produced — the server snapshot
  // always reports "seen" so the modal never flashes open then closed while
  // hydration catches up with the real localStorage value.
  const alreadySeen = useSyncExternalStore(noopSubscribe, hasSeenOnboarding, () => true);
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0);
  const open = !alreadySeen && !dismissed;

  const finish = () => {
    markOnboardingSeen();
    setDismissed(true);
    setStep(0);
  };

  const next = () => {
    if (step >= STEPS.length - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  };

  if (!open) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-[420px] rounded-2xl bg-surface-strong p-7">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-accent">
          Step {step + 1} of {STEPS.length}
        </div>
        <div className="mt-2.5 font-serif text-[19px] font-semibold text-foreground">
          {current.title}
        </div>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{current.body}</p>

        <div className="mt-5 flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={cn(
                "h-1.5 rounded-full transition-[width] duration-150",
                i === step ? "w-[18px] bg-accent" : "w-1.5 bg-border"
              )}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={finish}
            className="text-[13px] text-muted hover:text-foreground"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-[9px] bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            {step >= STEPS.length - 1 ? "Let's go" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
