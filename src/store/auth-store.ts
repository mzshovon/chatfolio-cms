import { create } from "zustand";
import * as authApi from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { getStoredRefreshToken, setStoredRefreshToken } from "@/lib/storage/refresh-token";

type AuthState = {
  user: authApi.AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  pendingChallenge: authApi.TwoFactorChallenge | null;
  status: "idle" | "loading";
  // True until the initial silent-restore attempt (from a stored refresh
  // token) has resolved one way or the other — guards (RequireAuth /
  // GuestOnly) wait on this instead of redirecting on the very first
  // render, so a reload doesn't bounce an otherwise-valid session to /login.
  restoring: boolean;
  restoreSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ requiresTwoFactor: boolean }>;
  verifyTwoFactor: (code: string) => Promise<void>;
  resendTwoFactor: () => Promise<void>;
  cancelTwoFactor: () => void;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;
  setUser: (user: authApi.AuthUser) => void;
};

// The access token stays memory-only (short-lived, cheap to re-derive). The
// refresh token is persisted to localStorage — see
// src/lib/storage/refresh-token.ts for why that's a deliberate, explicitly
// chosen tradeoff rather than the doc's default recommendation.
let inFlightRefresh: Promise<authApi.TokenPair> | null = null;

async function settleSession(
  set: (partial: Partial<AuthState>) => void,
  tokens: authApi.TokenPair
) {
  setStoredRefreshToken(tokens.refresh_token);
  const user = await authApi.me(tokens.access_token);
  set({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    user,
    pendingChallenge: null,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  pendingChallenge: null,
  status: "idle",
  restoring: true,

  restoreSession: async () => {
    const stored = getStoredRefreshToken();
    if (!stored) {
      set({ restoring: false });
      return;
    }
    try {
      const tokens = await authApi.refresh(stored);
      await settleSession(set, tokens);
    } catch {
      setStoredRefreshToken(null);
    } finally {
      set({ restoring: false });
    }
  },

  login: async (email, password) => {
    set({ status: "loading" });
    try {
      const response = await authApi.login(email, password);
      if (response.requires_two_factor) {
        set({ pendingChallenge: response, status: "idle" });
        return { requiresTwoFactor: true };
      }
      await settleSession(set, response);
      set({ status: "idle" });
      return { requiresTwoFactor: false };
    } catch (error) {
      set({ status: "idle" });
      throw error;
    }
  },

  verifyTwoFactor: async (code) => {
    const { pendingChallenge } = get();
    if (!pendingChallenge) throw new Error("No pending two-factor challenge.");
    set({ status: "loading" });
    try {
      const tokens = await authApi.verifyTwoFactorLogin(pendingChallenge.challenge_token, code);
      await settleSession(set, tokens);
      set({ status: "idle" });
    } catch (error) {
      set({ status: "idle" });
      throw error;
    }
  },

  resendTwoFactor: async () => {
    const { pendingChallenge } = get();
    if (!pendingChallenge) throw new Error("No pending two-factor challenge.");
    await authApi.resendTwoFactorLogin(pendingChallenge.challenge_token);
  },

  cancelTwoFactor: () => set({ pendingChallenge: null }),

  register: async (email, password) => {
    set({ status: "loading" });
    try {
      await authApi.register(email, password);
    } finally {
      set({ status: "idle" });
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    setStoredRefreshToken(null);
    set({ user: null, accessToken: null, refreshToken: null, pendingChallenge: null });
    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => {});
    }
  },

  // Returns a live access token, transparently refreshing it first if it's
  // missing. Concurrent callers share one in-flight refresh request instead
  // of racing the single-use refresh token against each other (§2.3).
  getValidAccessToken: async () => {
    const { accessToken, refreshToken } = get();
    if (accessToken) return accessToken;
    if (!refreshToken) return null;

    try {
      if (!inFlightRefresh) {
        inFlightRefresh = authApi.refresh(refreshToken);
      }
      const tokens = await inFlightRefresh;
      setStoredRefreshToken(tokens.refresh_token);
      set({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
      return tokens.access_token;
    } catch (error) {
      setStoredRefreshToken(null);
      set({ user: null, accessToken: null, refreshToken: null });
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    } finally {
      inFlightRefresh = null;
    }
  },

  // Lets a page that changes account details (e.g. /dashboard/settings
  // after a successful email change) reflect the update immediately,
  // without waiting for the next /auth/refresh or a full reload.
  setUser: (user) => set({ user }),
}));
