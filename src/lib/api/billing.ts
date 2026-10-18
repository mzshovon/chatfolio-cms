import { apiRequest } from "@/lib/api/http";

// Feature keys defined by the backend's code-side catalogue
// (chatfolio/entitlements/catalog.py). The plan *values* come from the server.
export const FEATURE = {
  linksMax: "links_max",
  publishesLimit: "publishes_limit",
  customDomainsMax: "custom_domains_max",
  recruiterChatsLimit: "recruiter_chats_limit",
  chatMessagesPerSession: "chat_messages_per_session",
  aiTokensLimit: "ai_tokens_limit",
  chatHistoryDays: "chat_history_days",
  recruiterInsights: "recruiter_insights",
  calendarBooking: "calendar_booking",
  meetingsLimit: "meetings_limit",
  removeBadge: "remove_badge",
  modelSelection: "model_selection",
} as const;

export type FeatureValue = {
  kind: string;
  value_type: "int" | "bool";
  int_value: number | null;
  bool_value: boolean | null;
  unlimited: boolean;
  period: string | null;
  used: number | null;
  remaining: number | null;
};

export type Entitlements = {
  plan: { slug: string; name: string };
  source: "free" | "support_kori_license" | "trial" | "admin_grant" | string;
  expires_at: string | null;
  features: Record<string, FeatureValue>;
};

export type ModelOption = {
  id: string;
  provider: string;
  model_id: string;
  display_name: string;
  is_default: boolean;
  allowed: boolean;
  locked_reason: "plan" | "unavailable" | null;
};

export type ModelsResponse = {
  selection_enabled: boolean;
  selected_model_id: string | null;
  effective_model_id: string | null;
  models: ModelOption[];
};

export type PricingPlan = {
  slug: string;
  name: string;
  tagline: string;
  is_free: boolean;
  price: { amount_minor: number; amount: string; currency: string; symbol: string };
  duration: { unit: string; count: number; label: string | null };
  badge_text: string | null;
  cta_label: string;
  footnote: string;
  trial_days: number | null;
  purchase_url: string | null;
  bullets: string[];
};

export type Subscription = {
  id: string;
  plan_slug: string;
  plan_name: string;
  status: string;
  source: string;
  starts_at: string;
  expires_at: string | null;
};

export type SubscriptionResponse = {
  current: Subscription | null;
  history: Subscription[];
};

export type BillingStrategies = {
  strategies: {
    name: string;
    label: string;
    plans: { slug: string; name: string; purchase_url: string | null }[];
  }[];
  trials: { plan_slug: string; days: number }[];
};

export function getPricing() {
  return apiRequest<{ plans: PricingPlan[] }>("/pricing");
}

export function getEntitlements(accessToken: string) {
  return apiRequest<Entitlements>("/me/entitlements", { accessToken });
}

export function getModels(accessToken: string) {
  return apiRequest<ModelsResponse>("/me/models", { accessToken });
}

export function setModelPreference(accessToken: string, modelId: string | null) {
  return apiRequest<ModelsResponse>("/me/models/preference", {
    method: "PUT",
    accessToken,
    body: { model_id: modelId },
  });
}

export function getStrategies(accessToken: string) {
  return apiRequest<BillingStrategies>("/billing/strategies", { accessToken });
}

export function getSubscription(accessToken: string) {
  return apiRequest<SubscriptionResponse>("/billing/subscription", { accessToken });
}

export function activateLicense(accessToken: string, licenseKey: string, planSlug?: string) {
  return apiRequest<SubscriptionResponse>("/billing/activate", {
    method: "POST",
    accessToken,
    body: { license_key: licenseKey, ...(planSlug ? { plan_slug: planSlug } : {}) },
  });
}

export function startTrial(accessToken: string, planSlug: string) {
  return apiRequest<SubscriptionResponse>("/billing/trial", {
    method: "POST",
    accessToken,
    body: { plan_slug: planSlug },
  });
}
