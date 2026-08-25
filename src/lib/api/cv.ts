import { apiRequest } from "@/lib/api/http";

export type CvStatus = "pending" | "processing" | "parsed" | "failed";

export type CvJob = {
  id: string;
  status: CvStatus;
  file_type: string;
  size_bytes: number;
  error_message: string | null;
  parsed_json: unknown;
};

export function uploadCv(accessToken: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<CvJob>("/cv/upload", { method: "POST", body: formData, accessToken });
}

export function getCvStatus(accessToken: string, id: string) {
  return apiRequest<CvJob>(`/cv/${id}/status`, { accessToken });
}

export function retryCv(accessToken: string, id: string) {
  return apiRequest<CvJob>(`/cv/${id}/retry`, { method: "POST", accessToken });
}
