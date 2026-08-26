"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import * as adminApi from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useEffect, useState } from "react";

const PAGE_SIZE = 20;

const fieldClass =
  "w-full rounded-[9px] border border-border bg-surface-strong px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent";

export default function AdminPermissionsPage() {
  const authed = useAuthedRequest();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<adminApi.AdminPermission[]>([]);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ key: "", description: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authed((token) => adminApi.listPermissions(token, PAGE_SIZE, 0));
        if (!cancelled) setPermissions(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load permissions.");
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
    setDraft({ key: "", description: "" });
    setFormOpen(true);
    setError(null);
  };
  const openEdit = (p: adminApi.AdminPermission) => {
    setEditingId(p.id);
    setDraft({ key: p.key, description: p.description });
    setFormOpen(true);
    setError(null);
  };

  const saveForm = async () => {
    if (!/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(draft.key.trim())) {
      setError("Key must look like word.word (e.g. users.manage).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const updated = await authed((token) =>
          adminApi.updatePermission(token, editingId, { description: draft.description })
        );
        setPermissions((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await authed((token) => adminApi.createPermission(token, draft));
        setPermissions((prev) => [...prev, created]);
      }
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save this permission.");
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
      await authed((token) => adminApi.deletePermission(token, id));
      setPermissions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete this permission.");
    }
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

      {error && <Alert className="mt-4">{error}</Alert>}

      {formOpen && (
        <Card className="mt-4 flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[1fr_2fr]">
            <input
              placeholder="key.name (e.g. users.manage)"
              value={draft.key}
              disabled={Boolean(editingId)}
              onChange={(e) => setDraft((p) => ({ ...p, key: e.target.value }))}
              className={`${fieldClass} disabled:opacity-60`}
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
              disabled={saving}
              className="rounded-[9px] bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add permission"}
            </button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <Card className="mt-4 overflow-hidden p-0">
          <div className="flex border-b border-border px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted">
            <span className="flex-1">Key</span>
            <span className="flex-[2]">Description</span>
            <span className="flex-1">Used by</span>
            <span className="w-[150px]" />
          </div>
          {permissions.length === 0 && (
            <p className="px-5 py-6 text-[13px] text-muted">No permissions yet.</p>
          )}
          {permissions.map((p) => (
            <div key={p.id} className="flex items-center border-b border-border px-5 py-3.5 last:border-b-0">
              <span className="flex-1 font-mono text-[13px] text-foreground">{p.key}</span>
              <span className="flex-[2] text-[13px] text-muted">{p.description}</span>
              <span className="flex-1 text-[12.5px] text-muted">
                {p.used_by_roles_count} role{p.used_by_roles_count === 1 ? "" : "s"}
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
      )}

      {confirmPerm && (
        <ConfirmDialog
          title="Delete this permission?"
          description={`"${confirmPerm.key}" will be removed from any roles that grant it.`}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={onConfirmDelete}
        />
      )}
    </div>
  );
}
