import { apiRequest } from "@/lib/api/http";

export type Role = "candidate" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  is_active: boolean;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
};

export function register(email: string, password: string) {
  return apiRequest<AuthUser>("/auth/register", {
    method: "POST",
    body: { email, password },
  });
}

export function login(email: string, password: string) {
  return apiRequest<TokenPair>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function refresh(refreshToken: string) {
  return apiRequest<TokenPair>("/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}

export function logout(refreshToken: string) {
  return apiRequest<void>("/auth/logout", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}

export function me(accessToken: string) {
  return apiRequest<AuthUser>("/auth/me", { accessToken });
}
