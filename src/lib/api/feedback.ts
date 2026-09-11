import { apiRequest } from "@/lib/api/http";

// Anonymous and unauthenticated by design (Docs §8: "there's no submitting
// user to join against") — no accessToken, and it lives under /v1/public
// rather than plain /v1 like every other call in this app.
export type SubmitFeedbackInput = {
  nps_score: number; // 0-5
  message: string | null;
};

export function submitFeedback(input: SubmitFeedbackInput) {
  return apiRequest<void>("/feedback", {
    method: "POST",
    prefix: "//v1/public",
    body: input,
  });
}
