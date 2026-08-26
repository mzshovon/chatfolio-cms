"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { SavedFlash } from "@/components/ui/saved-flash";
import { Spinner } from "@/components/ui/spinner";
import * as adminApi from "@/lib/api/admin";
import type { Role } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useSaveFlash } from "@/lib/hooks/use-save-flash";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const ROLES: { id: Role; name: string; description: string }[] = [
  { id: "admin", name: "Admin", description: "Full access to all admin views and actions." },
  { id: "candidate", name: "Candidate", description: "Manages their own portfolio and chats." },
];

const fieldClass =
  "w-full rounded-[9px] border border-border bg-surface-strong px-3.5 py-3 text-[13.5px] text-foreground outline-none focus:border-accent";

export function EditUserView() {
  const authed = useAuthedRequest();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savedFlash = useSaveFlash();

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [roleId, setRoleId] = useState<Role>((searchParams.get("role") as Role) ?? "candidate");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await authed((token) => adminApi.getUser(token, id));
        if (cancelled) return;
        setEmail(user.email);
        setRoleId(user.role);
        setIsActive(user.is_active);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load this user.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const initials = (email[0] ?? "?").toUpperCase();

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await authed((token) =>
        adminApi.updateUser(token, id, { email, role: roleId, is_active: isActive })
      );
      setEmail(updated.email);
      setRoleId(updated.role);
      setIsActive(updated.is_active);
      savedFlash.flash("user");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save this user.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-[640px] p-8">
      <Link href="/admin/users" className="text-[12.5px] text-muted hover:text-foreground">
        ← Back to Users
      </Link>
      <div className="mt-2.5 flex items-center gap-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-tint text-base font-semibold text-accent">
          {initials}
        </div>
        <div>
          <div className="font-serif text-[22px] font-semibold text-foreground">
            {email || "Unknown user"}
          </div>
          <p className="mt-0.5 text-[13px] text-muted">Editing account details and role.</p>
        </div>
      </div>

      <Card className="mt-5 flex flex-col gap-3.5">
        <div>
          <div className="mb-1.5 text-xs text-muted">Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <div className="mb-1.5 text-xs text-muted">Role assignment</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ROLES.map((r) => {
              const checked = roleId === r.id;
              return (
                <label
                  key={r.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-[10px] p-3 text-[13px]",
                    checked
                      ? "border-[1.5px] border-accent bg-accent-tint"
                      : "border border-border bg-surface-strong"
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={checked}
                    onChange={() => setRoleId(r.id)}
                    className="mt-1 accent-accent"
                  />
                  <div>
                    <div className="font-semibold text-foreground">{r.name}</div>
                    <div className="mt-0.5 text-[12px] text-muted">{r.description}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-foreground">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-accent"
          />
          Account active
        </label>

        {error && <Alert>{error}</Alert>}

        <div className="flex items-center justify-end gap-2.5">
          <SavedFlash state={savedFlash.get("user")} />
          <Link
            href="/admin/users"
            className="rounded-[9px] border border-border px-4 py-2.5 text-[13px] font-semibold text-foreground"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-[9px] bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </Card>
    </div>
  );
}
