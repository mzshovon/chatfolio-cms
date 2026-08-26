"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PreviewBanner } from "@/components/ui/preview-banner";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const ROLES = [
  { id: "admin", name: "Admin", description: "Full access to all admin views and actions." },
  { id: "candidate", name: "Candidate", description: "Manages their own portfolio and chats." },
  { id: "reviewer", name: "Reviewer", description: "Read-only access to chatfolios and metrics." },
];

const fieldClass =
  "w-full rounded-[9px] border border-border bg-surface-strong px-3.5 py-3 text-[13.5px] text-foreground outline-none focus:border-accent";

export function EditUserView() {
  const params = useSearchParams();
  const initialEmail = params.get("email") ?? "";
  const initialRole = params.get("role") ?? "candidate";

  const [email, setEmail] = useState(initialEmail);
  const [roleId, setRoleId] = useState(initialRole);
  const [isActive, setIsActive] = useState(true);
  const [saved, setSaved] = useState(false);

  const initials = (email[0] ?? "?").toUpperCase();

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

      <div className="mt-4">
        <PreviewBanner>
          Preview only — the API has no user-edit endpoint yet, so saving here doesn&apos;t reach
          the backend.
        </PreviewBanner>
      </div>

      <Card className="mt-5 flex flex-col gap-3.5">
        <div>
          <div className="mb-1.5 text-xs text-muted">Email</div>
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSaved(false);
            }}
            className={fieldClass}
          />
        </div>

        <div>
          <div className="mb-1.5 text-xs text-muted">Role assignment</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
                    onChange={() => {
                      setRoleId(r.id);
                      setSaved(false);
                    }}
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
            onChange={(e) => {
              setIsActive(e.target.checked);
              setSaved(false);
            }}
            className="accent-accent"
          />
          Account active
        </label>

        {saved && (
          <Alert variant="muted">
            Nothing was actually saved — this preview form has no backend to save to.
          </Alert>
        )}

        <div className="flex justify-end gap-2.5">
          <Link
            href="/admin/users"
            className="rounded-[9px] border border-border px-4 py-2.5 text-[13px] font-semibold text-foreground"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => setSaved(true)}
            className="rounded-[9px] bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground"
          >
            Save changes
          </button>
        </div>
      </Card>
    </div>
  );
}
