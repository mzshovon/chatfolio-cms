import { create } from "zustand";
import * as billingApi from "@/lib/api/billing";

type BillingData = {
  pricing: billingApi.PricingPlan[];
  strategies: billingApi.BillingStrategies;
  subscription: billingApi.SubscriptionResponse;
};

type BillingState = {
  data: BillingData | null;
  loadedAt: number;
  // Fetches pricing + strategies + subscription together. Concurrent callers
  // (React StrictMode's double effect, quick re-navigation) share one in-flight
  // request, and a fresh cache is reused instead of re-fetching.
  load: (accessToken: string, opts?: { force?: boolean }) => Promise<BillingData>;
  setSubscription: (subscription: billingApi.SubscriptionResponse) => void;
  setStrategies: (strategies: billingApi.BillingStrategies) => void;
  reset: () => void;
};

const TTL_MS = 60_000;
let inFlight: Promise<BillingData> | null = null;

export const useBillingStore = create<BillingState>((set, get) => ({
  data: null,
  loadedAt: 0,
  load: async (accessToken, { force = false } = {}) => {
    const { data, loadedAt } = get();
    if (!force && data && Date.now() - loadedAt < TTL_MS) return data;
    if (!inFlight) {
      inFlight = Promise.all([
        billingApi.getPricing(),
        billingApi.getStrategies(accessToken),
        billingApi.getSubscription(accessToken),
      ])
        .then(([p, strategies, subscription]) => {
          const next = { pricing: p.plans, strategies, subscription };
          set({ data: next, loadedAt: Date.now() });
          return next;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    return inFlight;
  },
  setSubscription: (subscription) =>
    set((s) => (s.data ? { data: { ...s.data, subscription }, loadedAt: Date.now() } : s)),
  setStrategies: (strategies) =>
    set((s) => (s.data ? { data: { ...s.data, strategies }, loadedAt: Date.now() } : s)),
  reset: () => {
    inFlight = null;
    set({ data: null, loadedAt: 0 });
  },
}));
