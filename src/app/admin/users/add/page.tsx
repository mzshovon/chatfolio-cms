"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import * as adminApi from "@/lib/api/admin";
import type { Role } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES: { id: Role; name: string; description: string }[] = [
  { id: "admin", name: "Admin", description: "Full access to all admin views and actions." },
  { id: "candidate", name: "Candidate", description: "Manages their own portfolio and chats." },
];

const fieldClass =
  "w-full rounded-[9px] border border-border bg-surface-strong px-3.5 py-3 text-[13.5px] text-foreground outline-none focus:border-accent";

export default function AdminAddUserPage() {
  const authed = useAuthedRequest();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<Role>("candidate");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const onCreate = async () => {
    if (!email) {
      setFormError("Email is required.");
      return;
    }
    if (!password || password.length < 8) {
      setFormError("Temporary password must be at least 8 characters.");
      return;
    }
    setFormError(null);
    setCreating(true);
    try {
      await authed((token) =>
        adminApi.createUser(token, { email, password, role: roleId, is_active: isActive })
      );
      router.push("/admin/users");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't create this user.");
    } finally {
      setCreating(false);
    }
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

      <Card className="mt-5 flex flex-col gap-3.5">
        <div>
          <div className="mb-1.5 text-xs text-muted">Email</div>
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFormError(null);
            }}
            placeholder="name@example.com"
            className={fieldClass}
          />
        </div>
        <div>
          <div className="mb-1.5 text-xs text-muted">Temporary password</div>
          <input
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFormError(null);
            }}
            placeholder="8-128 characters"
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
          Active immediately
        </label>

        {formError && <Alert>{formError}</Alert>}

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
            disabled={creating}
            className="rounded-[9px] bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create user"}
          </button>
        </div>
      </Card>
    </div>
  );
}
