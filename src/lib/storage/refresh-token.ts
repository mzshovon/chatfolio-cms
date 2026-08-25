const STORAGE_KEY = "chatfolio_refresh_token";

// Persisting the refresh token to localStorage is a deliberate, explicitly
// chosen tradeoff (see Docs/ADMIN_PANEL_UI_REFERENCE.md §2.2) — it's the
// riskiest of the doc's own storage options (any XSS becomes a 30-day
// account takeover, not just a same-tab one), picked anyway so a page
// reload doesn't force a fresh login. The access token still never touches
// storage; it stays memory-only and is re-derived via /auth/refresh.

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredRefreshToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(STORAGE_KEY, token);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — silently no-op;
    // the session just won't survive a reload in that case.
  }
}
