"use client";

import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PreviewBanner } from "@/components/ui/preview-banner";
import { cn } from "@/lib/cn";
import { useState } from "react";

const ALL_PERMISSIONS = [
  "users.view",
  "users.manage",
  "roles.manage",
  "chatfolios.view",
  "chatfolios.unpublish",
  "metrics.view",
  "cvjobs.retry",
];

type RoleRow = { id: number; name: string; description: string; permissions: string[] };

const INITIAL_ROLES: RoleRow[] = [
  { id: 1, name: "Admin", description: "Full access to all admin views and actions.", permissions: [...ALL_PERMISSIONS] },
  { id: 2, name: "Candidate", description: "Manages their own portfolio and chats.", permissions: [] },
  { id: 3, name: "Reviewer", description: "Read-only access to chatfolios and metrics.", permissions: ["chatfolios.view", "metrics.view"] },
];

const fieldClass =
  "w-full rounded-[9px] border border-border bg-surface-strong px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>(INITIAL_ROLES);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState({ name: "", description: "", permissions: [] as string[] });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setDraft({ name: "", description: "", permissions: [] });
    setFormOpen(true);
  };
  const openEdit = (r: RoleRow) => {
    setEditingId(r.id);
    setDraft({ name: r.name, description: r.description, permissions: [...r.permissions] });
    setFormOpen(true);
  };
  const togglePermission = (perm: string) => {
    setDraft((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };
  const saveForm = () => {
    if (editingId) {
      setRoles((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...draft } : r)));
    } else {
      setRoles((prev) => [...prev, { id: Date.now(), ...draft }]);
    }
    setFormOpen(false);
  };

  const confirmRole = roles.find((r) => r.id === confirmDeleteId);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-[22px] font-semibold text-foreground">Roles</h1>
          <p className="mt-1 text-[13px] text-muted">
            Define roles and which permissions each one grants.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-[9px] bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground"
        >
          + Add role
        </button>
      </div>

      <div className="mt-4">
        <PreviewBanner>
          Preview only — the API has no roles/permissions system yet (a user&apos;s role is a
          fixed field, not editable via any endpoint). Everything here lives only in this
          browser tab and resets on reload.
        </PreviewBanner>
      </div>

      {formOpen && (
        <Card className="mt-4 flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[1fr_2fr]">
            <input
              placeholder="Role name"
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              className={fieldClass}
            />
            <input
              placeholder="Description"
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              className={fieldClass}
            />
          </div>
          <div>
            <div className="mb-2 text-xs text-muted">Permissions</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ALL_PERMISSIONS.map((perm) => {
                const checked = draft.permissions.includes(perm);
                return (
                  <label
                    key={perm}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-[8px] border border-border px-2.5 py-2 text-[12.5px]",
                      checked && "bg-accent-tint"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(perm)}
                      className="accent-accent"
                    />
                    {perm}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-[9px] border border-border px-4 py-2.5 text-[13px] font-semibold text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveForm}
              className="rounded-[9px] bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground"
            >
              {editingId ? "Save changes" : "Add role"}
            </button>
          </div>
        </Card>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {roles.map((role) => (
          <Card key={role.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[14.5px] font-semibold text-foreground">{role.name}</div>
                <div className="mt-0.5 text-[12.5px] text-muted">{role.description}</div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(role)}
                  className="rounded-[7px] border border-border bg-surface-strong px-2.5 py-1.5 text-[11.5px] font-semibold text-foreground"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(role.id)}
                  className="rounded-[7px] border border-danger-fg/30 bg-surface-strong px-2.5 py-1.5 text-[11.5px] font-semibold text-danger-fg"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(role.permissions.length ? role.permissions : ["No permissions"]).map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-accent-tint px-2.5 py-1 text-[11px] font-semibold text-accent"
                >
                  {p}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {confirmRole && (
        <ConfirmDialog
          title="Delete this role?"
          description={`Users assigned to "${confirmRole.name}" will need a new role. This is a local preview only.`}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            setRoles((prev) => prev.filter((r) => r.id !== confirmDeleteId));
            setConfirmDeleteId(null);
          }}
        />
      )}
    </div>
  );
}
