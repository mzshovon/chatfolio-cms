"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { StatusPill } from "@/components/ui/status-pill";
import * as adminApi from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import Link from "next/link";
import { useEffect, useState } from "react";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const authed = useAuthedRequest();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<adminApi.AdminUser[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<adminApi.AdminUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await authed((token) => adminApi.listUsers(token, PAGE_SIZE, page * PAGE_SIZE));
        if (cancelled) return;
        setUsers(data);
        setHasNext(data.length === PAGE_SIZE);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load users.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggleBan = async (u: adminApi.AdminUser) => {
    setBusyId(u.id);
    setError(null);
    try {
      const updated = await authed((token) =>
        adminApi.updateUser(token, u.id, { is_active: !u.is_active })
      );
      setUsers((prev) => prev.map((row) => (row.id === u.id ? updated : row)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update this user.");
    } finally {
      setBusyId(null);
    }
  };

  const onConfirmDelete = async () => {
    if (!confirmDeleteUser) return;
    const target = confirmDeleteUser;
    setConfirmDeleteUser(null);
    setBusyId(target.id);
    setError(null);
    try {
      await authed((token) => adminApi.deleteUser(token, target.id));
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete this user.");
    } finally {
      setBusyId(null);
    }
  };

  const visibleUsers = users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-[22px] font-semibold text-foreground">Users</h1>
          <p className="mt-1 text-[13px] text-muted">Every registered candidate and admin.</p>
        </div>
        <div className="flex gap-2.5">
          <input
            placeholder="Search this page by email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[240px] rounded-[9px] border border-border bg-surface-strong px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-accent"
          />
          <Link
            href="/admin/users/add"
            className="inline-flex items-center rounded-[9px] bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            + Add user
          </Link>
        </div>
      </div>

      {error && <Alert className="mt-4">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <Card className="mt-5 overflow-hidden p-0">
          <div className="flex border-b border-border px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted">
            <span className="flex-[2]">Email</span>
            <span className="flex-1">Role</span>
            <span className="flex-1">Status</span>
            <span className="w-[190px]" />
          </div>
          {visibleUsers.length === 0 && (
            <p className="px-5 py-6 text-[13px] text-muted">No users match.</p>
          )}
          {visibleUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center border-b border-border px-5 py-3.5 last:border-b-0"
            >
              <span className="flex-[2] text-[13.5px] text-foreground">{u.email}</span>
              <span className="flex-1">
                <StatusPill tone={u.role === "admin" ? "accent" : "neutral"}>{u.role}</StatusPill>
              </span>
              <span className="flex-1">
                <StatusPill tone={u.is_active ? "success" : "danger"}>
                  {u.is_active ? "Active" : "Inactive"}
                </StatusPill>
              </span>
              <span className="flex w-[190px] justify-end gap-1.5">
                <Link
                  href={`/admin/users/${u.id}/edit?email=${encodeURIComponent(u.email)}&role=${u.role}`}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-[7px] border border-border bg-surface-strong px-2.5 py-1.5 text-[11.5px] font-semibold text-foreground"
                >
                  ✎ Edit
                </Link>
                <button
                  type="button"
                  onClick={() => toggleBan(u)}
                  disabled={busyId === u.id}
                  className="whitespace-nowrap rounded-[7px] border border-border bg-surface-strong px-2.5 py-1.5 text-[11.5px] font-semibold text-foreground disabled:opacity-60"
                >
                  {u.is_active ? "Ban" : "Unban"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteUser(u)}
                  disabled={busyId === u.id}
                  className="whitespace-nowrap rounded-[7px] border border-danger-fg/30 bg-surface-strong px-2.5 py-1.5 text-[11.5px] font-semibold text-danger-fg disabled:opacity-60"
                >
                  Delete
                </button>
              </span>
            </div>
          ))}
        </Card>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12.5px] text-muted">Page {page + 1}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-[8px] border border-border bg-surface-strong px-3.5 py-2 text-[12.5px] font-semibold text-foreground disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            className="rounded-[8px] border border-border bg-surface-strong px-3.5 py-2 text-[12.5px] font-semibold text-foreground disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {confirmDeleteUser && (
        <ConfirmDialog
          title="Delete this user?"
          description={`${confirmDeleteUser.email} will be permanently removed. This can't be undone.`}
          onCancel={() => setConfirmDeleteUser(null)}
          onConfirm={onConfirmDelete}
        />
      )}
    </div>
  );
}
