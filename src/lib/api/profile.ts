import { apiRequest } from "@/lib/api/http";

export type ProfileStatus = "draft" | "approved";

export type Profile = {
  id: string;
  full_name: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  contact_email: string | null;
  phone: string | null;
  social_links: Record<string, string>;
  status: ProfileStatus;
};

export type ProfilePatch = Partial<
  Pick<Profile, "full_name" | "title" | "bio" | "location" | "contact_email" | "phone"> & {
    social_links: Record<string, string>;
  }
>;

export function getProfile(accessToken: string) {
  return apiRequest<Profile>("/profiles/me", { accessToken });
}

export function updateProfile(accessToken: string, patch: ProfilePatch) {
  return apiRequest<Profile>("/profiles/me", { method: "PATCH", body: patch, accessToken });
}

export type Experience = {
  id: string;
  company: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
};

export type ExperienceInput = Omit<Experience, "id">;

export function listExperience(accessToken: string) {
  return apiRequest<Experience[]>("/profiles/me/experience", { accessToken });
}
export function createExperience(accessToken: string, input: ExperienceInput) {
  return apiRequest<Experience>("/profiles/me/experience", {
    method: "POST",
    body: input,
    accessToken,
  });
}
export function updateExperience(accessToken: string, id: string, patch: Partial<ExperienceInput>) {
  return apiRequest<Experience>(`/profiles/me/experience/${id}`, {
    method: "PATCH",
    body: patch,
    accessToken,
  });
}
export function deleteExperience(accessToken: string, id: string) {
  return apiRequest<void>(`/profiles/me/experience/${id}`, { method: "DELETE", accessToken });
}

export type Project = {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  impact: string | null;
  links: Record<string, string>;
};

export type ProjectInput = Omit<Project, "id">;

export function listProjects(accessToken: string) {
  return apiRequest<Project[]>("/profiles/me/projects", { accessToken });
}
export function createProject(accessToken: string, input: ProjectInput) {
  return apiRequest<Project>("/profiles/me/projects", { method: "POST", body: input, accessToken });
}
export function updateProject(accessToken: string, id: string, patch: Partial<ProjectInput>) {
  return apiRequest<Project>(`/profiles/me/projects/${id}`, {
    method: "PATCH",
    body: patch,
    accessToken,
  });
}
export function deleteProject(accessToken: string, id: string) {
  return apiRequest<void>(`/profiles/me/projects/${id}`, { method: "DELETE", accessToken });
}

export type Skill = {
  id: string;
  name: string;
  category: string | null;
  proficiency: string | null;
};

export type SkillInput = Omit<Skill, "id">;

export function listSkills(accessToken: string) {
  return apiRequest<Skill[]>("/profiles/me/skills", { accessToken });
}
export function createSkill(accessToken: string, input: SkillInput) {
  return apiRequest<Skill>("/profiles/me/skills", { method: "POST", body: input, accessToken });
}
export function deleteSkill(accessToken: string, id: string) {
  return apiRequest<void>(`/profiles/me/skills/${id}`, { method: "DELETE", accessToken });
}

export type Education = {
  id: string;
  institution: string;
  degree: string | null;
  field: string | null;
  start_date: string | null;
  end_date: string | null;
};

export type EducationInput = Omit<Education, "id">;

export function listEducation(accessToken: string) {
  return apiRequest<Education[]>("/profiles/me/education", { accessToken });
}
export function createEducation(accessToken: string, input: EducationInput) {
  return apiRequest<Education>("/profiles/me/education", {
    method: "POST",
    body: input,
    accessToken,
  });
}
export function updateEducation(accessToken: string, id: string, patch: Partial<EducationInput>) {
  return apiRequest<Education>(`/profiles/me/education/${id}`, {
    method: "PATCH",
    body: patch,
    accessToken,
  });
}
export function deleteEducation(accessToken: string, id: string) {
  return apiRequest<void>(`/profiles/me/education/${id}`, { method: "DELETE", accessToken });
}
