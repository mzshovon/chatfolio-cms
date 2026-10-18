import { create } from "zustand";
import * as billingApi from "@/lib/api/billing";

type EntitlementsState = {
  entitlements: billingApi.Entitlements | null;
  status: "idle" | "loading" | "ready" | "error";
  load: (accessToken: string) => Promise<void>;
  reset: () => void;
};

// The plan and every feature gate come from the backend (GET /me/entitlements);
// the UI only reads them to render locks and usage. The server enforces each
// limit itself, so a stale value here can never grant access.
export const useEntitlementsStore = create<EntitlementsState>((set) => ({
  entitlements: null,
  status: "idle",
  load: async (accessToken) => {
    set((s) => ({ status: s.entitlements ? s.status : "loading" }));
    try {
      const entitlements = await billingApi.getEntitlements(accessToken);
      set({ entitlements, status: "ready" });
    } catch {
      set((s) => ({ status: s.entitlements ? "ready" : "error" }));
    }
  },
  reset: () => set({ entitlements: null, status: "idle" }),
}));

export type PlanAccess = {
  ready: boolean;
  planName: string;
  planSlug: string;
  isFree: boolean;
  source: string | null;
  expiresAt: string | null;
  // Boolean gate: true only when the plan explicitly allows it. Until the
  // plan has loaded this is false, so locked UI never flashes open.
  can: (key: string) => boolean;
  feature: (key: string) => billingApi.FeatureValue | undefined;
};

export function usePlanAccess(): PlanAccess {
  const entitlements = useEntitlementsStore((s) => s.entitlements);
  const status = useEntitlementsStore((s) => s.status);

  return {
    ready: status === "ready" && entitlements !== null,
    planName: entitlements?.plan.name ?? "",
    planSlug: entitlements?.plan.slug ?? "",
    isFree: entitlements ? entitlements.source === "free" : false,
    source: entitlements?.source ?? null,
    expiresAt: entitlements?.expires_at ?? null,
    can: (key) => {
      const f = entitlements?.features[key];
      if (!f) return false;
      return f.value_type === "bool" ? f.bool_value === true : f.unlimited || (f.int_value ?? 0) > 0;
    },
    feature: (key) => entitlements?.features[key],
  };
}

const FEATURE_LABELS: Record<string, string> = {
  links_max: "Chatfolio links",
  publishes_limit: "Publishes",
  custom_domains_max: "Custom domains",
  recruiter_chats_limit: "Recruiter chats",
  chat_messages_per_session: "Messages per chat",
  ai_tokens_limit: "AI tokens",
  chat_history_days: "Chat history",
  recruiter_insights: "Recruiter insights",
  calendar_booking: "Calendar booking",
  meetings_limit: "Meetings",
  remove_badge: "Remove Chatfolio badge",
  model_selection: "Choose AI model",
};

export function featureLabel(key: string) {
  return FEATURE_LABELS[key] ?? key.replace(/_/g, " ");
}
