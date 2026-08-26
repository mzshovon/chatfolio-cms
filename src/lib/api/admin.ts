import { apiRequest } from "@/lib/api/http";
import type { Role } from "@/lib/api/auth";

export type AdminUser = {
  id: string;
  email: string;
  role: Role;
  is_active: boolean;
};

export function listUsers(accessToken: string, limit = 20, offset = 0) {
  return apiRequest<AdminUser[]>("/admin/users", { accessToken, query: { limit, offset } });
}

export function getUser(accessToken: string, id: string) {
  return apiRequest<AdminUser>(`/admin/users/${id}`, { accessToken });
}

export type CreateUserInput = { email: string; password: string; role: Role; is_active: boolean };

export function createUser(accessToken: string, input: CreateUserInput) {
  return apiRequest<AdminUser>("/admin/users", { method: "POST", accessToken, body: input });
}

export type UpdateUserInput = Partial<{ email: string; role: Role; is_active: boolean }>;

export function updateUser(accessToken: string, id: string, input: UpdateUserInput) {
  return apiRequest<AdminUser>(`/admin/users/${id}`, { method: "PATCH", accessToken, body: input });
}

export function deleteUser(accessToken: string, id: string) {
  return apiRequest<void>(`/admin/users/${id}`, { method: "DELETE", accessToken });
}

export type AdminChatfolio = {
  id: string;
  slug: string;
  is_published: boolean;
  published_at: string | null;
  owner_email: string;
};

export function listChatfolios(
  accessToken: string,
  isPublished?: boolean,
  limit = 20,
  offset = 0
) {
  return apiRequest<AdminChatfolio[]>("/admin/chatfolios", {
    accessToken,
    query: { is_published: isPublished, limit, offset },
  });
}

export function unpublishChatfolio(accessToken: string, id: string) {
  return apiRequest<AdminChatfolio>(`/admin/chatfolios/${id}/unpublish`, {
    method: "POST",
    accessToken,
  });
}

export type AdminMetrics = {
  total_users: number;
  total_candidates: number;
  published_chatfolios: number;
  total_chat_sessions: number;
  total_chat_messages: number;
  flagged_chat_sessions: number;
  cv_parse_success_count: number;
  cv_parse_failed_count: number;
  // Added per Required_API_Doc.md §6 (Option A — additive fields on the
  // existing endpoint). Optional so this still degrades gracefully if a
  // given backend deploy hasn't rolled them out yet.
  total_portfolio_visitors?: number;
  recruiters_engaged?: number;
  ai_tokens_used?: number;
  ai_tokens_monthly_quota?: number;
};

export function getMetrics(accessToken: string) {
  return apiRequest<AdminMetrics>("/admin/metrics", { accessToken });
}

export type FailedCvJob = {
  id: string;
  status: "failed";
  error_message: string;
  owner_email: string;
  created_at: string;
};

export function listFailedCvJobs(accessToken: string, limit = 20, offset = 0) {
  return apiRequest<FailedCvJob[]>("/admin/cv-jobs/failed", {
    accessToken,
    query: { limit, offset },
  });
}

export function retryFailedCvJob(accessToken: string, id: string) {
  return apiRequest<FailedCvJob & { status: string }>(`/admin/cv-jobs/${id}/retry`, {
    method: "POST",
    accessToken,
  });
}

export type AdminRole = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
};

export function listRoles(accessToken: string, limit = 20, offset = 0) {
  return apiRequest<AdminRole[]>("/admin/roles", { accessToken, query: { limit, offset } });
}

export type RoleInput = { name: string; description: string; permissions: string[] };

export function createRole(accessToken: string, input: RoleInput) {
  return apiRequest<AdminRole>("/admin/roles", { method: "POST", accessToken, body: input });
}

export function updateRole(accessToken: string, id: string, input: Partial<RoleInput>) {
  return apiRequest<AdminRole>(`/admin/roles/${id}`, { method: "PATCH", accessToken, body: input });
}

export function deleteRole(accessToken: string, id: string) {
  return apiRequest<void>(`/admin/roles/${id}`, { method: "DELETE", accessToken });
}

export type AdminPermission = {
  id: string;
  key: string;
  description: string;
  used_by_roles_count: number;
};

export function listPermissions(accessToken: string, limit = 20, offset = 0) {
  return apiRequest<AdminPermission[]>("/admin/permissions", { accessToken, query: { limit, offset } });
}

export type PermissionInput = { key: string; description: string };

export function createPermission(accessToken: string, input: PermissionInput) {
  return apiRequest<AdminPermission>("/admin/permissions", { method: "POST", accessToken, body: input });
}

export function updatePermission(accessToken: string, id: string, input: Partial<PermissionInput>) {
  return apiRequest<AdminPermission>(`/admin/permissions/${id}`, {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export function deletePermission(accessToken: string, id: string) {
  return apiRequest<void>(`/admin/permissions/${id}`, { method: "DELETE", accessToken });
}
