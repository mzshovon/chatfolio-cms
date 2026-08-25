import { apiRequest } from "@/lib/api/http";

export type CvStatus = "pending" | "processing" | "parsed" | "failed";

export type ParsedExperience = {
  company: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
};

export type ParsedProject = {
  title: string;
  description: string | null;
  tech_stack: string[];
  impact: string | null;
  links: Record<string, string>;
};

export type ParsedSkill = {
  name: string;
  category: string | null;
  proficiency: string | null;
};

export type ParsedEducation = {
  institution: string;
  degree: string | null;
  field: string | null;
  start_date: string | null;
  end_date: string | null;
};

export type ParsedProfile = {
  full_name: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  contact_email: string | null;
  phone: string | null;
  social_links: Record<string, string>;
  experience: ParsedExperience[];
  projects: ParsedProject[];
  skills: ParsedSkill[];
  education: ParsedEducation[];
};

export type CvJob = {
  id: string;
  status: CvStatus;
  file_type: string;
  size_bytes: number;
  error_message: string | null;
  parsed_json: ParsedProfile | null;
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
