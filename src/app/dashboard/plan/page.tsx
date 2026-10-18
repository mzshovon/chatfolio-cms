"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import * as billingApi from "@/lib/api/billing";
import { ApiError } from "@/lib/api/http";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useBillingStore } from "@/store/billing-store";
import { featureLabel, useEntitlementsStore, usePlanAccess } from "@/store/entitlements-store";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

const SOURCE_LABEL: Record<string, string> = {
  free: "Free plan",
  support_kori_license: "License key",
  trial: "Free trial",
  admin_grant: "Granted by Chatfolio",
};

const PERIOD_LABEL: Record<string, string> = { monthly: "this month", lifetime: "in total", daily: "today" };

function describeValue(f: billingApi.FeatureValue, key: string) {
  if (f.value_type === "bool") return f.bool_value ? "Included" : "Not included";
  if (f.unlimited) return "Unlimited";
  if (key === "chat_history_days") return `Last ${f.int_value} days`;
  const period = f.period ? ` ${PERIOD_LABEL[f.period] ?? ""}` : "";
  return f.used !== null ? `${f.used} / ${f.int_value}${period}` : `${f.int_value}${period}`;
}

export default function PlanPage() {
  const authed = useAuthedRequest();
  const plan = usePlanAccess();
  const loadEntitlements = useEntitlementsStore((s) => s.load);
  const entitlements = useEntitlementsStore((s) => s.entitlements);

  const billing = useBillingStore((s) => s.data);
  const loadBilling = useBillingStore((s) => s.load);
  const setStrategiesCache = useBillingStore((s) => s.setStrategies);
  const setSubscriptionCache = useBillingStore((s) => s.setSubscription);
  const pricing = billing?.pricing ?? [];
  const strategies = billing?.strategies ?? null;
  const subscription = billing?.subscription ?? null;
  const [error, setError] = useState<string | null>(null);

  const [licenseKey, setLicenseKey] = useState("");
  const [planSlug, setPlanSlug] = useState("");
  const [activating, setActivating] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [trialBusy, setTrialBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await authed((t) => loadBilling(t));
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load your plan details.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authed, loadBilling]);

  const refreshPlan = async (sub: billingApi.SubscriptionResponse) => {
    setSubscriptionCache(sub);
    await authed((t) => loadEntitlements(t));
    // Trial eligibility / available plans change after activation.
    setStrategiesCache(await authed((t) => billingApi.getStrategies(t)));
  };

  const licenseStrategy = strategies?.strategies.find((s) => s.name === "support_kori_license");
  const licensePlans = licenseStrategy?.plans ?? [];
  // Always send a plan_slug taken from the strategy's plans: the user's pick
  // when there are several, otherwise the only (or first) one.
  const effectivePlanSlug = licensePlans.some((p) => p.slug === planSlug) ? planSlug : (licensePlans[0]?.slug ?? "");

  const onActivate = async (e: FormEvent) => {
    e.preventDefault();
    const key = licenseKey.trim();
    if (!key || activating) return;
    setLicenseError(null);
    setNotice(null);
    setActivating(true);
    try {
      const sub = await authed((t) =>
        billingApi.activateLicense(t, key, planSlug || licensePlans[0]?.slug)
      );
      setLicenseKey("");
      await refreshPlan(sub);
      setNotice(`${sub.current?.plan_name ?? "Your plan"} activated. Everything in the plan is unlocked.`);
    } catch (err) {
      setLicenseError(
        err instanceof ApiError
          ? err.status === 429
            ? "Too many attempts. Try again in a bit."
            : err.message
          : "Couldn't activate that key."
      );
    } finally {
      setActivating(false);
    }
  };

  const onTrial = async (slug: string) => {
    setTrialBusy(true);
    setLicenseError(null);
    setNotice(null);
    try {
      const sub = await authed((t) => billingApi.startTrial(t, slug));
      await refreshPlan(sub);
      setNotice("Your trial has started.");
    } catch (err) {
      setLicenseError(err instanceof ApiError ? err.message : "Couldn't start the trial.");
    } finally {
      setTrialBusy(false);
    }
  };

  if ((!billing && !error) || !plan.ready) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        {error ? <Alert>{error}</Alert> : <Spinner />}
      </div>
    );
  }

  const features = Object.entries(entitlements?.features ?? {});
  const limits = features.filter(([, f]) => f.value_type === "int" && f.kind !== "window" && !f.unlimited);
  const included = features
    .filter(([, f]) => (f.value_type === "bool" ? f.bool_value : f.unlimited))
    .map(([key, f]) => (f.value_type === "bool" ? featureLabel(key) : `Unlimited ${featureLabel(key).toLowerCase()}`));
  const history = features.find(([key]) => key === billingApi.FEATURE.chatHistoryDays)?.[1];
  const paid = !plan.isFree;
  const current = subscription?.current ?? null;
  const otherPlans = pricing.filter((p) => !p.is_free && p.slug !== plan.planSlug);
  const trials = strategies?.trials ?? [];
  const canActivate = Boolean(licenseStrategy);

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5 p-8">
      <div>
        <h1 className="font-serif text-[22px] font-semibold text-foreground">Plan &amp; License</h1>
        <p className="mt-1 text-[13px] text-muted">What your plan includes, how much you&apos;ve used, and how to upgrade.</p>
      </div>

      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      {paid ? (
        <div className="rounded-2xl bg-brand-bg p-6 text-brand-fg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold tracking-[0.12em] text-brand-accent">CURRENT PLAN</div>
              <div className="mt-1 font-serif text-[26px] font-semibold">{plan.planName}</div>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-success-bg/15 px-3 py-1.5 text-[12.5px] font-semibold text-[#7fd3a0]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#3fae6a]" />
              {SOURCE_LABEL[plan.source ?? ""] ?? "Active"}
            </span>
          </div>
          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            <Stat dark label="Started" value={current ? formatDate(current.starts_at) : "—"} />
            <Stat dark label="Expires" value={plan.expiresAt ? formatDate(plan.expiresAt) : "No expiry"} />
            <Stat dark label="Time left" value={plan.expiresAt ? daysLeft(plan.expiresAt) : "—"} />
          </div>
          {included.length > 0 && (
            <>
              <div className="mt-6 text-xs font-bold tracking-[0.12em] text-brand-muted">INCLUDED IN YOUR PLAN</div>
              <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-x-5 gap-y-2.5">
                {included.map((label) => (
                  <div key={label} className="flex gap-2.5 text-[13.5px] leading-snug text-brand-fg/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" strokeWidth={2.5} />
                    {label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <Card className="bg-surface-strong">
          <div className="text-xs font-bold tracking-[0.12em] text-muted">CURRENT PLAN</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-foreground">{plan.planName}</div>
          {history && !history.unlimited && (
            <p className="mt-2 text-[12.5px] text-muted">Chat history covers the last {history.int_value} days.</p>
          )}
        </Card>
      )}

      {limits.length > 0 && (
        <Card className="bg-surface-strong">
          <div className="text-[15px] font-semibold text-foreground">Usage &amp; limits</div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
            {limits.map(([key, f]) => {
              const pct = f.used !== null && f.int_value ? Math.min(100, (f.used / f.int_value) * 100) : 0;
              return (
                <div key={key} className="rounded-[10px] bg-background px-3.5 py-3">
                  <div className="flex flex-wrap justify-between gap-x-2 text-[12.5px]">
                    <span className="font-semibold text-foreground">{featureLabel(key)}</span>
                    <span className="text-muted">{describeValue(f, key)}</span>
                  </div>
                  {f.used !== null && (
                    <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-border">
                      <div
                        className={cn("h-full rounded-full", pct >= 100 ? "bg-flag" : "bg-accent")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {(canActivate || trials.length > 0) && (
        <Card className="bg-surface-strong">
          <div className="text-[15px] font-semibold text-foreground">
            {paid ? "Renew or change your plan" : "Activate your license key"}
          </div>
          {canActivate && (
            <>
              <p className="mt-1 text-[12.5px] text-muted">
                Bought a plan? Paste the license key from your thank-you page or email.
              </p>
              <form onSubmit={onActivate} className="mt-3.5 flex flex-wrap gap-2">
                {licensePlans.length > 1 && (
                  <select
                    value={effectivePlanSlug}
                    onChange={(e) => setPlanSlug(e.target.value)}
                    className="rounded-[10px] border border-border bg-surface-strong px-3 text-[13.5px] text-foreground"
                  >
                    {licensePlans.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  value={licenseKey}
                  onChange={(e) => {
                    setLicenseKey(e.target.value);
                    setLicenseError(null);
                  }}
                  placeholder="Paste your license key"
                  spellCheck={false}
                  autoComplete="off"
                  className={cn(
                    "min-w-[220px] flex-1 rounded-[10px] border-[1.5px] bg-surface-strong px-3.5 py-3 font-mono text-[15px] font-semibold tracking-wide text-foreground uppercase outline-none focus:border-accent",
                    licenseError ? "border-danger-fg/50" : "border-border"
                  )}
                />
                <button
                  type="submit"
                  disabled={activating || !licenseKey.trim()}
                  className="flex min-h-[46px] items-center gap-2 rounded-[10px] bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-60"
                >
                  {activating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {activating ? "Checking…" : "Activate"}
                </button>
              </form>
            </>
          )}
          {licenseError && <Alert className="mt-3">{licenseError}</Alert>}
          {trials.length > 0 && (
            <div className={cn("flex flex-wrap items-center gap-2.5", canActivate && "mt-4 border-t border-border pt-4")}>
              {trials.map((t) => (
                <button
                  key={t.plan_slug}
                  type="button"
                  disabled={trialBusy}
                  onClick={() => onTrial(t.plan_slug)}
                  className="rounded-lg border border-border bg-surface-strong px-3.5 py-2 text-[13px] font-semibold text-foreground disabled:opacity-60"
                >
                  Start {t.days}-day {pricing.find((p) => p.slug === t.plan_slug)?.name ?? t.plan_slug} trial
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {otherPlans.length > 0 && (
        <div>
          <div className="mb-3 text-[15px] font-semibold text-foreground">{paid ? "Other plans" : "Upgrade options"}</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-4">
            {otherPlans.map((p) => (
              <Card key={p.slug} className="flex flex-col bg-surface-strong">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif text-lg font-semibold text-foreground">{p.name}</span>
                  {p.badge_text && (
                    <span className="rounded-full bg-accent-tint px-2 py-0.5 text-[10.5px] font-bold text-accent">
                      {p.badge_text}
                    </span>
                  )}
                </div>
                {p.tagline && <p className="mt-1 text-[12.5px] text-muted">{p.tagline}</p>}
                <div className="mt-3 text-foreground">
                  <span className="font-serif text-[26px] font-semibold">
                    {p.price.symbol}
                    {p.price.amount}
                  </span>
                  {p.duration.label && <span className="ml-1 text-[13px] text-muted">/ {p.duration.label}</span>}
                </div>
                <ul className="mt-3 flex flex-1 flex-col gap-1.5">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-[13px] text-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.5} />
                      {b}
                    </li>
                  ))}
                </ul>
                {p.purchase_url ? (
                  <a
                    href={p.purchase_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-[10px] bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-accent-foreground hover:bg-accent-hover"
                  >
                    {p.cta_label} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="mt-4 rounded-[10px] bg-background px-4 py-2.5 text-center text-[13px] text-muted">
                    Purchase link coming soon
                  </span>
                )}
                {p.footnote && <p className="mt-2 text-center text-[11.5px] text-muted">{p.footnote}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {subscription && subscription.history.length > 0 && (
        <Card className="bg-surface-strong">
          <div className="text-[15px] font-semibold text-foreground">Subscription history</div>
          <div className="mt-2 flex flex-col">
            {subscription.history.map((h) => (
              <div key={h.id} className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-b-0">
                <div className="min-w-[140px] flex-1">
                  <div className="text-[13.5px] font-medium text-foreground">{h.plan_name}</div>
                  <div className="text-xs text-muted">
                    {formatDate(h.starts_at)}
                    {h.expires_at ? ` – ${formatDate(h.expires_at)}` : ""} · {SOURCE_LABEL[h.source] ?? h.source}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold capitalize",
                    h.status === "active" ? "bg-success-bg text-success-fg" : "bg-border text-muted"
                  )}
                >
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={cn("rounded-xl px-4 py-3.5", dark ? "bg-white/5" : "bg-background")}>
      <div className={cn("text-xs", dark ? "text-brand-muted" : "text-muted")}>{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}

function daysLeft(iso: string) {
  const left = Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
  return `${left} ${left === 1 ? "day" : "days"}`;
}
