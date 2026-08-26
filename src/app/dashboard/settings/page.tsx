"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { SavedFlash } from "@/components/ui/saved-flash";
import * as settingsApi from "@/lib/api/settings";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useSaveFlash } from "@/lib/hooks/use-save-flash";
import { useAuthStore } from "@/store/auth-store";
import { useState } from "react";

const fieldClass =
  "w-full rounded-[9px] border border-border bg-surface-strong px-3.5 py-3 text-[13.5px] text-foreground outline-none focus:border-accent";

export default function AccountSettingsPage() {
  const authed = useAuthedRequest();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const savedFlash = useSaveFlash();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  const onChangePassword = async () => {
    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError("New password must be 8-128 characters.");
      return;
    }
    setPasswordError(null);
    setPasswordSaving(true);
    try {
      await authed((token) => settingsApi.changePassword(token, currentPassword, newPassword));
      setCurrentPassword("");
      setNewPassword("");
      savedFlash.flash("password");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Couldn't change your password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const onChangeEmail = async () => {
    if (!newEmail) {
      setEmailError("Enter a new email address.");
      return;
    }
    if (!emailPassword) {
      setEmailError("Enter your password to confirm.");
      return;
    }
    setEmailError(null);
    setEmailSaving(true);
    try {
      const updated = await authed((token) => settingsApi.changeEmail(token, newEmail, emailPassword));
      if (user) setUser({ ...user, email: updated.email });
      setNewEmail("");
      setEmailPassword("");
      savedFlash.flash("email");
    } catch (err) {
      setEmailError(err instanceof ApiError ? err.message : "Couldn't change your email.");
    } finally {
      setEmailSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5 p-8">
      <div>
        <h1 className="font-serif text-[22px] font-semibold text-foreground">Account settings</h1>
        <p className="mt-1 text-[13px] text-muted">
          Manage the login credentials for {user?.email}.
        </p>
      </div>

      <Card>
        <span className="font-serif text-[15px] font-semibold text-foreground">Change password</span>
        <div className="mt-3.5 flex flex-col gap-3">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setPasswordError(null);
            }}
            className={fieldClass}
          />
          <input
            type="password"
            placeholder="New password (8-128 characters)"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordError(null);
            }}
            className={fieldClass}
          />
        </div>
        {passwordError && <Alert className="mt-3">{passwordError}</Alert>}
        <div className="mt-4 flex items-center justify-end gap-2.5">
          <SavedFlash state={savedFlash.get("password")} />
          <button
            type="button"
            onClick={onChangePassword}
            disabled={passwordSaving}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-60"
          >
            {passwordSaving ? "Saving…" : "Update password"}
          </button>
        </div>
      </Card>

      <Card>
        <span className="font-serif text-[15px] font-semibold text-foreground">Change login email</span>
        <div className="mt-3.5 flex flex-col gap-3">
          <input
            type="email"
            placeholder="New email address"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setEmailError(null);
            }}
            className={fieldClass}
          />
          <input
            type="password"
            placeholder="Confirm with your password"
            value={emailPassword}
            onChange={(e) => {
              setEmailPassword(e.target.value);
              setEmailError(null);
            }}
            className={fieldClass}
          />
        </div>
        {emailError && <Alert className="mt-3">{emailError}</Alert>}
        <div className="mt-4 flex items-center justify-end gap-2.5">
          <SavedFlash state={savedFlash.get("email")} />
          <button
            type="button"
            onClick={onChangeEmail}
            disabled={emailSaving}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-60"
          >
            {emailSaving ? "Saving…" : "Update email"}
          </button>
        </div>
      </Card>
    </div>
  );
}
