"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PreviewBanner } from "@/components/ui/preview-banner";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useState } from "react";

const ROLES = [
  { id: "admin", name: "Admin", description: "Full access to all admin views and actions." },
  { id: "candidate", name: "Candidate", description: "Manages their own portfolio and chats." },
  { id: "reviewer", name: "Reviewer", description: "Read-only access to chatfolios and metrics." },
];

const fieldClass =
  "w-full rounded-[9px] border border-border bg-surface-strong px-3.5 py-3 text-[13.5px] text-foreground outline-none focus:border-accent";

export default function AdminAddUserPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("candidate");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onCreate = () => {
    if (!email) {
      setFormError("Email is required.");
      setNotice(null);
      return;
    }
    setFormError(null);
    setNotice(
      "This is a preview form — the API has no endpoint for admin-created users yet, so nothing was actually created."
    );
  };

  return (
    <div className="max-w-[640px] p-8">
      <Link href="/admin/users" className="text-[12.5px] text-muted hover:text-foreground">
        ← Back to Users
      </Link>
      <h1 className="mt-2.5 font-serif text-[22px] font-semibold text-foreground">
        Add a new user
      </h1>
      <p className="mt-1 text-[13px] text-muted">Invite a candidate or admin and assign their role.</p>

      <div className="mt-4">
        <PreviewBanner>
          Preview only — user creation isn&apos;t supported by the API yet. Fill this in freely;
          clicking Create won&apos;t persist anything.
        </PreviewBanner>
      </div>

      <Card className="mt-5 flex flex-col gap-3.5">
        <div>
          <div className="mb-1.5 text-xs text-muted">Email</div>
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFormError(null);
              setNotice(null);
            }}
            placeholder="name@example.com"
            className={fieldClass}
          />
        </div>
        <div>
          <div className="mb-1.5 text-xs text-muted">Phone</div>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+880 1XXX-XXXXXX"
            className={fieldClass}
          />
        </div>
        <div>
          <div className="mb-1.5 text-xs text-muted">Temporary password</div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Assigned on creation"
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
                      setNotice(null);
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
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-accent"
          />
          Active immediately
        </label>

        {formError && <Alert>{formError}</Alert>}
        {notice && <Alert variant="muted">{notice}</Alert>}

        <div className="flex justify-end gap-2.5">
          <Link
            href="/admin/users"
            className="rounded-[9px] border border-border px-4 py-2.5 text-[13px] font-semibold text-foreground"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onCreate}
            className="rounded-[9px] bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground"
          >
            Create user
          </button>
        </div>
      </Card>
    </div>
  );
}
