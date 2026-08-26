"use client";

import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PreviewBanner } from "@/components/ui/preview-banner";
import { useState } from "react";

type PermissionRow = { id: number; key: string; description: string; usedBy: number };

const INITIAL_PERMISSIONS: PermissionRow[] = [
  { id: 1, key: "users.view", description: "View the users list.", usedBy: 3 },
  { id: 2, key: "users.manage", description: "Create, edit, ban, and delete users.", usedBy: 1 },
  { id: 3, key: "roles.manage", description: "Create, edit, and delete roles.", usedBy: 1 },
  { id: 4, key: "chatfolios.view", description: "View all candidate chatfolios.", usedBy: 2 },
  { id: 5, key: "chatfolios.unpublish", description: "Unpublish any chatfolio.", usedBy: 1 },
  { id: 6, key: "metrics.view", description: "View platform metrics.", usedBy: 2 },
  { id: 7, key: "cvjobs.retry", description: "Retry failed CV parse jobs.", usedBy: 1 },
];

const fieldClass =
  "w-full rounded-[9px] border border-border bg-surface-strong px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent";

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionRow[]>(INITIAL_PERMISSIONS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState({ key: "", description: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setDraft({ key: "", description: "" });
    setFormOpen(true);
  };
  const openEdit = (p: PermissionRow) => {
    setEditingId(p.id);
    setDraft({ key: p.key, description: p.description });
    setFormOpen(true);
  };
  const saveForm = () => {
    if (editingId) {
      setPermissions((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...draft } : p)));
    } else {
      setPermissions((prev) => [...prev, { id: Date.now(), usedBy: 0, ...draft }]);
    }
    setFormOpen(false);
  };

  const confirmPerm = permissions.find((p) => p.id === confirmDeleteId);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-[22px] font-semibold text-foreground">Permissions</h1>
          <p className="mt-1 text-[13px] text-muted">
            The individual capabilities roles are built from.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-[9px] bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground"
        >
          + Add permission
        </button>
      </div>

      <div className="mt-4">
        <PreviewBanner>
          Preview only — there&apos;s no permissions system in the API to manage. Changes here
          live only in this browser tab and reset on reload.
        </PreviewBanner>
      </div>

      {formOpen && (
        <Card className="mt-4 flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[1fr_2fr]">
            <input
              placeholder="key.name (e.g. users.manage)"
              value={draft.key}
              onChange={(e) => setDraft((p) => ({ ...p, key: e.target.value }))}
              className={fieldClass}
            />
            <input
              placeholder="Description"
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              className={fieldClass}
            />
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
              {editingId ? "Save changes" : "Add permission"}
            </button>
          </div>
        </Card>
      )}

      <Card className="mt-4 overflow-hidden p-0">
        <div className="flex border-b border-border px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted">
          <span className="flex-1">Key</span>
          <span className="flex-[2]">Description</span>
          <span className="flex-1">Used by</span>
          <span className="w-[150px]" />
        </div>
        {permissions.map((p) => (
          <div key={p.id} className="flex items-center border-b border-border px-5 py-3.5 last:border-b-0">
            <span className="flex-1 font-mono text-[13px] text-foreground">{p.key}</span>
            <span className="flex-[2] text-[13px] text-muted">{p.description}</span>
            <span className="flex-1 text-[12.5px] text-muted">
              {p.usedBy} role{p.usedBy === 1 ? "" : "s"}
            </span>
            <span className="flex w-[150px] justify-end gap-1.5">
              <button
                type="button"
                onClick={() => openEdit(p)}
                className="rounded-[7px] border border-border bg-surface-strong px-2.5 py-1.5 text-[11.5px] font-semibold text-foreground"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(p.id)}
                className="rounded-[7px] border border-danger-fg/30 bg-surface-strong px-2.5 py-1.5 text-[11.5px] font-semibold text-danger-fg"
              >
                Delete
              </button>
            </span>
          </div>
        ))}
      </Card>

      {confirmPerm && (
        <ConfirmDialog
          title="Delete this permission?"
          description={`"${confirmPerm.key}" will be removed from any roles that grant it. This is a local preview only.`}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            setPermissions((prev) => prev.filter((p) => p.id !== confirmDeleteId));
            setConfirmDeleteId(null);
          }}
        />
      )}
    </div>
  );
}
