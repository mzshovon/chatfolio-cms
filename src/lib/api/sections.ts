import { apiRequest } from "@/lib/api/http";

export type SectionType = "intro" | "summary";
export type SectionStatus = "draft" | "approved";
export type GeneratedBy = "ai" | "manual";

export type PortfolioSection = {
  id: string;
  section_type: SectionType;
  content: string;
  status: SectionStatus;
  generated_by: GeneratedBy;
  version: number;
};

export function getSections(accessToken: string) {
  return apiRequest<PortfolioSection[]>("/sections", { accessToken });
}

export function updateSection(accessToken: string, id: string, content: string) {
  return apiRequest<PortfolioSection>(`/sections/${id}`, {
    method: "PATCH",
    body: { content },
    accessToken,
  });
}

export function regenerateSection(accessToken: string, id: string) {
  return apiRequest<PortfolioSection>(`/sections/${id}/regenerate`, {
    method: "POST",
    accessToken,
  });
}

export function approveSection(accessToken: string, id: string) {
  return apiRequest<PortfolioSection>(`/sections/${id}/approve`, {
    method: "POST",
    accessToken,
  });
}
