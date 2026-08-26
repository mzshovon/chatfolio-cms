import { apiRequest } from "@/lib/api/http";
import type { AuthUser } from "@/lib/api/auth";

export function changePassword(accessToken: string, currentPassword: string, newPassword: string) {
  return apiRequest<void>("/auth/change-password", {
    method: "POST",
    accessToken,
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

export function changeEmail(accessToken: string, newEmail: string, password: string) {
  return apiRequest<AuthUser>("/auth/change-email", {
    method: "PATCH",
    accessToken,
    body: { new_email: newEmail, password },
  });
}
