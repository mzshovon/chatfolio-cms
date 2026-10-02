import { apiRequest } from "@/lib/api/http";

export type MeetingSettings = {
  google_connected: boolean;
  google_account_email: string | null;
  granted_scopes: string[];
  access_token_expires_at: string | null;
  // Secret — only used to prove the connection is live; never log or persist it.
  access_token: string | null;
};

export function getMeetingSettings(accessToken: string) {
  return apiRequest<MeetingSettings>("/meeting-settings", { accessToken });
}

export function getGoogleConnectUrl(accessToken: string) {
  return apiRequest<{ authorization_url: string }>("/meeting-settings/google/connect", { accessToken });
}

export function disconnectGoogle(accessToken: string) {
  return apiRequest<void>("/meeting-settings/google", { method: "DELETE", accessToken });
}
