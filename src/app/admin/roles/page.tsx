"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import * as adminApi from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

const ALL_PERMISSIONS = [
  "users.view",
  "users.manage",
  "roles.manage",
  "chatfolios.view",
  "chatfolios.unpublish",
  "metrics.view",
  "cvjobs.retry",
];

const PAGE_SIZE = 20;

const fieldClass =
  "w-full rounded-[9px] border border-border bg-surface-strong px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent";

export default function AdminRolesPage() {
  const authed = useAuthedRequest();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<adminApi.AdminRole[]>([]);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", description: "", permissions: [] as string[] });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authed((token) => adminApi.listRoles(token, PAGE_SIZE, 0));
        if (!cancelled) setRoles(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load roles.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setDraft({ name: "", description: "", permissions: [] });
    setFormOpen(true);
    setError(null);
  };
  const openEdit = (r: adminApi.AdminRole) => {
    setEditingId(r.id);
    setDraft({ name: r.name, description: r.description, permissions: [...r.permissions] });
    setFormOpen(true);
    setError(null);
  };
  const togglePermission = (perm: string) => {
    setDraft((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const saveForm = async () => {
    if (!draft.name.trim()) {
      setError("Role name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const updated = await authed((token) => adminApi.updateRole(token, editingId, draft));
        setRoles((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
      } else {
        const created = await authed((token) => adminApi.createRole(token, draft));
        setRoles((prev) => [...prev, created]);
      }
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save this role.");
    } finally {
      setSaving(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setError(null);
    try {
      await authed((token) => adminApi.deleteRole(token, id));
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete this role.");
    }
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

      {error && <Alert className="mt-4">{error}</Alert>}

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
              disabled={saving}
              className="rounded-[9px] bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add role"}
            </button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {roles.length === 0 && <p className="text-[13px] text-muted">No roles yet.</p>}
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
      )}

      {confirmRole && (
        <ConfirmDialog
          title="Delete this role?"
          description={`Users assigned to "${confirmRole.name}" will need a new role.`}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={onConfirmDelete}
        />
      )}
    </div>
  );
}
