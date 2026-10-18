"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PlanLock } from "@/components/ui/plan-lock";
import { SavedFlash } from "@/components/ui/saved-flash";
import { StatusPill } from "@/components/ui/status-pill";
import { FEATURE } from "@/lib/api/billing";
import { ApiError } from "@/lib/api/http";
import { cn } from "@/lib/cn";
import { usePlanAccess } from "@/store/entitlements-store";
import * as meetingApi from "@/lib/api/meeting-settings";
import {
  DAYS,
  isValidSlot,
  loadAvailability,
  saveAvailability,
  type Availability,
  type Day,
  type DaySlot,
} from "@/lib/availability";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useSaveFlash } from "@/lib/hooks/use-save-flash";
import { useCallback, useEffect, useState } from "react";

const timeClass =
  "rounded-[9px] border border-border bg-surface-strong px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-accent disabled:opacity-50";

const PRESETS: { label: string; build: () => Availability }[] = [
  {
    label: "Weekdays 9–5",
    build: () => presetFor(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "09:00", "17:00"),
  },
  {
    label: "Every day 10–6",
    build: () => presetFor([...DAYS], "10:00", "18:00"),
  },
];

function presetFor(days: Day[], start: string, end: string): Availability {
  return Object.fromEntries(
    DAYS.map((d) => [d, { enabled: days.includes(d), start, end }])
  ) as Availability;
}

export function GoogleCalendarCard() {
  const authed = useAuthedRequest();
  const plan = usePlanAccess();
  const savedFlash = useSaveFlash();

  const [settings, setSettings] = useState<meetingApi.MeetingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ variant: "success" | "danger"; text: string } | null>(null);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);

  const [availability, setAvailability] = useState<Availability | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await authed((token) => meetingApi.getMeetingSettings(token));
      setSettings(data);
      setNeedsReconnect(false);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Access token expired with no refresh token — only a reconnect fixes it.
        setNeedsReconnect(true);
        setSettings(null);
      } else if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [authed]);

  useEffect(() => {
    const init = async () => {
      await refresh();
      // Google's callback redirects back here with ?meeting_settings=...
      const params = new URLSearchParams(window.location.search);
      const result = params.get("meeting_settings");
      if (result === "google_connected") {
        setNotice({ variant: "success", text: "Google Calendar connected." });
      } else if (result === "google_error") {
        setNotice({
          variant: "danger",
          text: "Couldn't connect Google Calendar. Consent was denied or the link expired — try again.",
        });
      }
      if (result) {
        params.delete("meeting_settings");
        const qs = params.toString();
        window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
      }
      setAvailability(loadAvailability());
    };
    void init();
  }, [refresh]);

  const enable = async () => {
    setBusy(true);
    setError(null);
    try {
      const { authorization_url } = await authed((token) => meetingApi.getGoogleConnectUrl(token));
      // Top-level navigation: Google's consent screen can't render inside fetch.
      window.location.href = authorization_url;
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 503
          ? "Google Calendar isn't configured on the server yet."
          : err instanceof ApiError
            ? err.message
            : "Couldn't start the Google connection."
      );
      setBusy(false);
    }
  };

  const disable = async () => {
    setConfirmDisable(false);
    setBusy(true);
    setError(null);
    try {
      await authed((token) => meetingApi.disconnectGoogle(token));
      setNotice({ variant: "success", text: "Google Calendar disabled." });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't disconnect Google Calendar.");
    } finally {
      setBusy(false);
    }
  };

  const connected = settings?.google_connected ?? false;

  const updateDay = (day: Day, patch: Partial<DaySlot>) =>
    setAvailability((prev) => (prev ? { ...prev, [day]: { ...prev[day], ...patch } } : prev));

  const copyToAll = (from: Day) =>
    setAvailability((prev) => {
      if (!prev) return prev;
      const { start, end } = prev[from];
      return Object.fromEntries(DAYS.map((d) => [d, { ...prev[d], start, end }])) as Availability;
    });

  const allValid = availability ? DAYS.every((d) => isValidSlot(availability[d])) : true;

  const onSaveAvailability = () => {
    if (!availability || !allValid) return;
    saveAvailability(availability);
    savedFlash.flash("availability");
  };

  const meetings = plan.feature(FEATURE.meetingsLimit);
  const locked = plan.ready && !plan.can(FEATURE.calendarBooking);

  return (
    <>
      <PlanLock
        locked={locked}
        title="Calendar booking isn't in your plan"
        description="Recruiters book Google Meet with you in one click."
        className="rounded-2xl"
      >
        <Card className="bg-surface-strong p-5 sm:p-[22px]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[#e8f0fe] font-bold text-[#1a73e8]">
              M
            </div>
            <div className="min-w-[200px] flex-1">
              <div className="text-[15px] font-semibold text-foreground">Google Meet booking</div>
              <div className="text-[12.5px] text-muted">Let recruiters book a call straight from your chatfolio.</div>
            </div>
            {!loading &&
              (connected ? (
                <StatusPill tone="success" className="text-xs">
                  Connected · {settings?.google_account_email ?? "Google account"}
                </StatusPill>
              ) : (
                <button
                  type="button"
                  onClick={enable}
                  disabled={busy}
                  className="rounded-lg border border-border bg-surface-strong px-3.5 py-2 text-[13px] font-semibold text-foreground disabled:opacity-60"
                >
                  {busy ? "Redirecting…" : needsReconnect ? "Reconnect Google account" : "Connect Google account"}
                </button>
              ))}
          </div>

          {notice && (
            <Alert variant={notice.variant} className="mt-3">
              {notice.text}
            </Alert>
          )}
          {error && <Alert className="mt-3">{error}</Alert>}
          {needsReconnect && (
            <Alert className="mt-3">Your Google session expired. Reconnect Google Calendar to continue.</Alert>
          )}

          <div className={cn("mt-5 transition-opacity", !connected && "opacity-55")}>
            {meetings && !meetings.unlimited && meetings.used !== null && (
              <p className="mb-3 text-[12.5px] text-muted">
                {meetings.used} of {meetings.int_value} meetings used on your plan.
              </p>
            )}
            <div className="text-[12.5px] font-semibold text-muted">Availability</div>
            <p className="mt-0.5 text-[12px] text-muted-subtle">
              Saved in this browser for now — the backend has no availability endpoint yet.
            </p>

            {availability && (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setAvailability(preset.build())}
                      className="rounded-full border border-border bg-surface-strong px-3 py-1 text-[11.5px] font-semibold text-muted hover:text-foreground"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3.5 flex flex-col gap-2">
                  {DAYS.map((day) => {
                    const slot = availability[day];
                    const invalid = !isValidSlot(slot);
                    return (
                      <div key={day} className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          aria-pressed={slot.enabled}
                          onClick={() => updateDay(day, { enabled: !slot.enabled })}
                          className={cn(
                            "w-[52px] rounded-lg border py-2 text-xs font-semibold",
                            slot.enabled
                              ? "border-accent/40 bg-accent-tint text-accent"
                              : "border-border bg-surface-strong text-muted-subtle"
                          )}
                        >
                          {day.slice(0, 3)}
                        </button>
                        <input
                          type="time"
                          aria-label={`${day} start time`}
                          value={slot.start}
                          disabled={!slot.enabled}
                          onChange={(e) => updateDay(day, { start: e.target.value })}
                          className={timeClass}
                        />
                        <span className="text-[12px] text-muted">to</span>
                        <input
                          type="time"
                          aria-label={`${day} end time`}
                          value={slot.end}
                          disabled={!slot.enabled}
                          onChange={(e) => updateDay(day, { end: e.target.value })}
                          className={timeClass}
                        />
                        {slot.enabled && (
                          <button
                            type="button"
                            onClick={() => copyToAll(day)}
                            className="text-[11.5px] font-semibold text-accent"
                          >
                            Copy to all
                          </button>
                        )}
                        {invalid && <span className="text-[11.5px] text-danger-fg">End must be after start</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-border pt-4">
              {connected ? (
                <button
                  type="button"
                  onClick={() => setConfirmDisable(true)}
                  disabled={busy}
                  className="text-[13px] font-semibold text-danger-fg disabled:opacity-60"
                >
                  Disconnect Google
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2.5">
                <SavedFlash state={savedFlash.get("availability")} />
                <button
                  type="button"
                  onClick={onSaveAvailability}
                  disabled={!allValid}
                  className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-60"
                >
                  Save availability
                </button>
              </div>
            </div>
          </div>
        </Card>
      </PlanLock>

      {confirmDisable && (
        <ConfirmDialog
          title="Disconnect Google Calendar?"
          description="This revokes access and removes the stored connection. You can connect again any time."
          confirmLabel="Yes, disconnect"
          cancelLabel="Keep connected"
          onConfirm={disable}
          onCancel={() => setConfirmDisable(false)}
        />
      )}
    </>
  );
}
