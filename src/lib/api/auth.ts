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

export type TwoFactorMethod = "email" | "phone" | "both";

export type TwoFactorChallenge = {
  requires_two_factor: true;
  challenge_token: string;
  method: TwoFactorMethod;
  masked_destinations: string[];
};

export type LoginResponse = (TokenPair & { requires_two_factor: false }) | TwoFactorChallenge;

export function register(email: string, password: string) {
  return apiRequest<AuthUser>("/auth/register", {
    method: "POST",
    body: { email, password },
  });
}

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function verifyTwoFactorLogin(challengeToken: string, code: string) {
  return apiRequest<TokenPair & { requires_two_factor: false }>("/auth/2fa/login/verify", {
    method: "POST",
    body: { challenge_token: challengeToken, code },
  });
}

export function resendTwoFactorLogin(challengeToken: string) {
  return apiRequest<void>("/auth/2fa/login/resend", {
    method: "POST",
    body: { challenge_token: challengeToken },
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

export function forgotPassword(email: string) {
  return apiRequest<void>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function resetPassword(token: string, newPassword: string) {
  return apiRequest<void>("/auth/reset-password", {
    method: "POST",
    body: { token, new_password: newPassword },
  });
}
