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
