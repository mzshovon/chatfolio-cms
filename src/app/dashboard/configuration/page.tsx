"use client";

import { GoogleCalendarCard } from "@/components/dashboard/google-calendar-card";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import * as billingApi from "@/lib/api/billing";
import { ApiError } from "@/lib/api/http";
import { cn } from "@/lib/cn";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { usePlanAccess } from "@/store/entitlements-store";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const PROVIDER_LABEL: Record<string, string> = {
  deepseek: "DeepSeek",
  openai: "OpenAI",
  gemini: "Google Gemini",
};

export default function ConfigurationPage() {
  const authed = useAuthedRequest();
  const plan = usePlanAccess();

  const [models, setModels] = useState<billingApi.ModelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authed((t) => billingApi.getModels(t));
        if (!cancelled) setModels(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load AI models.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = async (model: billingApi.ModelOption) => {
    if (!models?.selection_enabled || !model.allowed || savingId) return;
    if (models.effective_model_id === model.id) return;
    setSavingId(model.id);
    setError(null);
    try {
      // The default model is "no preference" — clearing the choice keeps
      // future default changes automatic.
      const next = await authed((t) => billingApi.setModelPreference(t, model.is_default ? null : model.id));
      setModels(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't change the model.");
    } finally {
      setSavingId(null);
    }
  };

  const readOnly = models ? !models.selection_enabled : true;

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5 p-8">
      <div>
        <h1 className="font-serif text-[22px] font-semibold text-foreground">Configuration</h1>
        <p className="mt-1 text-[13px] text-muted">How your chatfolio answers and books meetings.</p>
      </div>

      <Card className="bg-surface-strong p-5 sm:p-[22px]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-accent-tint font-bold text-accent">
            AI
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="text-[15px] font-semibold text-foreground">AI model</div>
            <div className="text-[12.5px] text-muted">The model that answers recruiters on your behalf.</div>
          </div>
          {models && readOnly && (
            <Link href="/dashboard/plan" className="text-xs font-semibold text-accent hover:text-accent-hover">
              Model choice is a paid feature · Upgrade
            </Link>
          )}
        </div>

        {error && <Alert className="mt-3">{error}</Alert>}

        {loading || !plan.ready ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-2.5">
            {models?.models.map((m) => {
              const selected = models.effective_model_id === m.id;
              const unavailable = m.locked_reason === "unavailable";
              const locked = !m.allowed || readOnly;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={locked && !selected}
                  aria-disabled={locked}
                  onClick={() => pick(m)}
                  className={cn(
                    "flex gap-3 rounded-xl border-[1.5px] p-3.5 text-left",
                    selected ? "border-accent bg-accent-tint/40" : "border-border bg-surface-strong",
                    locked ? (selected ? "cursor-default" : "cursor-not-allowed opacity-60") : "hover:border-muted-subtle"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2",
                      selected ? "border-accent" : "border-border"
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", selected ? "bg-accent" : "bg-transparent")} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                      <span className="text-sm font-semibold text-foreground">{m.display_name}</span>
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold",
                          m.is_default ? "bg-success-bg text-success-fg" : "bg-accent-tint text-accent"
                        )}
                      >
                        {!m.allowed && <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />}
                        {m.is_default
                          ? "Default"
                          : unavailable
                            ? "Unavailable"
                            : !m.allowed
                              ? "Upgrade"
                              : "Available"}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">
                      {PROVIDER_LABEL[m.provider] ?? m.provider}
                      {selected ? (savingId === m.id ? " · Saving…" : " · In use") : ""}
                    </span>
                  </span>
                </button>
              );
            })}
            {models && models.models.length === 0 && (
              <p className="text-[13px] text-muted">No models are available right now.</p>
            )}
          </div>
        )}
      </Card>

      <GoogleCalendarCard />
    </div>
  );
}
