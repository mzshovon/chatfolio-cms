import { apiRequest } from "@/lib/api/http";

export type RecruiterMetadata = {
  name: string | null;
  company: string | null;
  role: string | null;
  required_skills: string | null;
  experience_expectation: string | null;
  location_pref: string | null;
  timeline: string | null;
};

export type ConversationSummary = {
  id: string;
  started_at: string;
  last_active_at: string;
  is_flagged: boolean;
  reviewed_by_candidate: boolean;
  message_count: number;
  recruiter_metadata: RecruiterMetadata | null;
};

export type ConversationMessage = {
  role: "recruiter" | "assistant";
  content: string;
  intent: string | null;
  created_at: string;
};

export type ConversationDetail = ConversationSummary & {
  messages: ConversationMessage[];
};

export function listConversations(accessToken: string, limit = 20, offset = 0) {
  return apiRequest<ConversationSummary[]>("/dashboard/conversations", {
    accessToken,
    query: { limit, offset },
  });
}

export function getConversation(accessToken: string, id: string) {
  return apiRequest<ConversationDetail>(`/dashboard/conversations/${id}`, { accessToken });
}

export function markConversationReviewed(accessToken: string, id: string) {
  return apiRequest<ConversationSummary>(`/dashboard/conversations/${id}/mark-reviewed`, {
    method: "POST",
    accessToken,
  });
}

export type DashboardAnalytics = {
  portfolio_visitors_total: number;
  portfolio_visitors_delta_pct: number;
  ai_tokens_used: number;
  ai_tokens_monthly_quota: number;
};

export function getAnalytics(accessToken: string) {
  return apiRequest<DashboardAnalytics>("/dashboard/analytics", { accessToken });
}
