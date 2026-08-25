"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/http";
import * as profileApi from "@/lib/api/profile";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

type Tab = "profile" | "experience" | "projects" | "skills" | "education";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
];

const fieldClass =
  "w-full rounded-[9px] border border-border bg-surface-strong px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent";

function isoToMonth(iso: string | null) {
  return iso ? iso.slice(0, 7) : "";
}
function monthToIso(month: string) {
  return month ? `${month}-01` : null;
}

type DraftExperience = profileApi.ExperienceInput & { id: string; isNew: boolean; saving: boolean };
type DraftProject = Omit<profileApi.ProjectInput, "tech_stack"> & {
  id: string;
  techStackDraft: string;
  isNew: boolean;
  saving: boolean;
};
type DraftEducation = profileApi.EducationInput & { id: string; isNew: boolean; saving: boolean };

let tempIdCounter = 0;
function tempId() {
  tempIdCounter += 1;
  return `temp-${tempIdCounter}`;
}

export default function ProfileBuilderPage() {
  const authed = useAuthedRequest();

  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<profileApi.Profile | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(true);

  const [experience, setExperience] = useState<DraftExperience[]>([]);
  const [projects, setProjects] = useState<DraftProject[]>([]);
  const [skills, setSkills] = useState<profileApi.Skill[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [education, setEducation] = useState<DraftEducation[]>([]);

  const [confirmTarget, setConfirmTarget] = useState<
    { kind: "experience" | "project" | "education" | "skill"; id: string } | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prof, exp, proj, skl, edu] = await Promise.all([
          authed((token) => profileApi.getProfile(token)),
          authed((token) => profileApi.listExperience(token)),
          authed((token) => profileApi.listProjects(token)),
          authed((token) => profileApi.listSkills(token)),
          authed((token) => profileApi.listEducation(token)),
        ]);
        if (cancelled) return;
        setProfile(prof);
        setExperience(exp.map((e) => ({ ...e, isNew: false, saving: false })));
        setProjects(
          proj.map((p) => ({
            ...p,
            techStackDraft: p.tech_stack.join(", "),
            isNew: false,
            saving: false,
          }))
        );
        setSkills(skl);
        setEducation(edu.map((e) => ({ ...e, isNew: false, saving: false })));
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- profile fields ---
  const setProfileField = (patch: Partial<profileApi.Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    setProfileSaved(false);
  };
  const onSaveProfile = async () => {
    if (!profile) return;
    setProfileSaving(true);
    setError(null);
    try {
      const updated = await authed((token) =>
        profileApi.updateProfile(token, {
          full_name: profile.full_name,
          title: profile.title,
          bio: profile.bio,
          location: profile.location,
          contact_email: profile.contact_email,
          phone: profile.phone,
          social_links: profile.social_links,
        })
      );
      setProfile(updated);
      setProfileSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // --- experience ---
  const addExperience = () =>
    setExperience((prev) => [
      {
        id: tempId(),
        company: "",
        role: "",
        start_date: null,
        end_date: null,
        is_current: false,
        description: "",
        isNew: true,
        saving: false,
      },
      ...prev,
    ]);
  const patchExperience = (id: string, patch: Partial<DraftExperience>) =>
    setExperience((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const saveExperience = async (id: string) => {
    const row = experience.find((e) => e.id === id);
    if (!row) return;
    patchExperience(id, { saving: true });
    setError(null);
    const input: profileApi.ExperienceInput = {
      company: row.company,
      role: row.role,
      start_date: row.start_date,
      end_date: row.is_current ? null : row.end_date,
      is_current: row.is_current,
      description: row.description,
    };
    try {
      if (row.isNew) {
        const created = await authed((token) => profileApi.createExperience(token, input));
        setExperience((prev) =>
          prev.map((e) => (e.id === id ? { ...created, isNew: false, saving: false } : e))
        );
      } else {
        const updated = await authed((token) => profileApi.updateExperience(token, id, input));
        setExperience((prev) =>
          prev.map((e) => (e.id === id ? { ...updated, isNew: false, saving: false } : e))
        );
      }
    } catch (err) {
      patchExperience(id, { saving: false });
      setError(err instanceof ApiError ? err.message : "Couldn't save this entry.");
    }
  };

  // --- projects ---
  const addProject = () =>
    setProjects((prev) => [
      {
        id: tempId(),
        title: "",
        description: "",
        techStackDraft: "",
        impact: "",
        links: {},
        isNew: true,
        saving: false,
      },
      ...prev,
    ]);
  const patchProject = (id: string, patch: Partial<DraftProject>) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const saveProject = async (id: string) => {
    const row = projects.find((p) => p.id === id);
    if (!row) return;
    patchProject(id, { saving: true });
    setError(null);
    const input: profileApi.ProjectInput = {
      title: row.title,
      description: row.description,
      impact: row.impact,
      links: row.links,
      tech_stack: row.techStackDraft
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (row.isNew) {
        const created = await authed((token) => profileApi.createProject(token, input));
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...created, techStackDraft: created.tech_stack.join(", "), isNew: false, saving: false }
              : p
          )
        );
      } else {
        const updated = await authed((token) => profileApi.updateProject(token, id, input));
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...updated, techStackDraft: updated.tech_stack.join(", "), isNew: false, saving: false }
              : p
          )
        );
      }
    } catch (err) {
      patchProject(id, { saving: false });
      setError(err instanceof ApiError ? err.message : "Couldn't save this entry.");
    }
  };

  // --- education ---
  const addEducation = () =>
    setEducation((prev) => [
      {
        id: tempId(),
        institution: "",
        degree: "",
        field: "",
        start_date: null,
        end_date: null,
        isNew: true,
        saving: false,
      },
      ...prev,
    ]);
  const patchEducation = (id: string, patch: Partial<DraftEducation>) =>
    setEducation((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const saveEducation = async (id: string) => {
    const row = education.find((e) => e.id === id);
    if (!row) return;
    patchEducation(id, { saving: true });
    setError(null);
    const input: profileApi.EducationInput = {
      institution: row.institution,
      degree: row.degree,
      field: row.field,
      start_date: row.start_date,
      end_date: row.end_date,
    };
    try {
      if (row.isNew) {
        const created = await authed((token) => profileApi.createEducation(token, input));
        setEducation((prev) =>
          prev.map((e) => (e.id === id ? { ...created, isNew: false, saving: false } : e))
        );
      } else {
        const updated = await authed((token) => profileApi.updateEducation(token, id, input));
        setEducation((prev) =>
          prev.map((e) => (e.id === id ? { ...updated, isNew: false, saving: false } : e))
        );
      }
    } catch (err) {
      patchEducation(id, { saving: false });
      setError(err instanceof ApiError ? err.message : "Couldn't save this entry.");
    }
  };

  // --- skills ---
  const addSkill = async () => {
    const name = skillDraft.trim();
    if (!name) return;
    setSkillDraft("");
    setError(null);
    try {
      const created = await authed((token) =>
        profileApi.createSkill(token, { name, category: null, proficiency: null })
      );
      setSkills((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add that skill.");
    }
  };

  // --- delete flow (shared confirm dialog) ---
  const requestDelete = (kind: "experience" | "project" | "education" | "skill", id: string) => {
    const isUnsaved =
      (kind === "experience" && experience.find((e) => e.id === id)?.isNew) ||
      (kind === "project" && projects.find((p) => p.id === id)?.isNew) ||
      (kind === "education" && education.find((e) => e.id === id)?.isNew);
    if (isUnsaved) {
      removeLocally(kind, id);
      return;
    }
    setConfirmTarget({ kind, id });
  };
  const removeLocally = (kind: "experience" | "project" | "education" | "skill", id: string) => {
    if (kind === "experience") setExperience((prev) => prev.filter((e) => e.id !== id));
    if (kind === "project") setProjects((prev) => prev.filter((p) => p.id !== id));
    if (kind === "education") setEducation((prev) => prev.filter((e) => e.id !== id));
    if (kind === "skill") setSkills((prev) => prev.filter((s) => s.id !== id));
  };
  const onConfirmDelete = async () => {
    if (!confirmTarget) return;
    const { kind, id } = confirmTarget;
    setConfirmTarget(null);
    setError(null);
    try {
      if (kind === "experience") await authed((token) => profileApi.deleteExperience(token, id));
      if (kind === "project") await authed((token) => profileApi.deleteProject(token, id));
      if (kind === "education") await authed((token) => profileApi.deleteEducation(token, id));
      if (kind === "skill") await authed((token) => profileApi.deleteSkill(token, id));
      removeLocally(kind, id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete this entry.");
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const initials = (profile.full_name?.split(" ").map((w) => w[0]).join("") || "?")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto flex max-w-[880px] gap-7 p-8">
      <div className="sticky top-8 flex w-[130px] shrink-0 flex-col self-start border-l-2 border-border pl-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "-ml-4 border-l-2 py-1.5 pl-3.5 text-left text-[12.5px]",
              tab === t.id
                ? "border-foreground font-semibold text-foreground"
                : "border-transparent text-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {error && <Alert>{error}</Alert>}

        {tab === "profile" && (
          <Card>
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-tint text-xl font-semibold text-accent">
                {initials}
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.3fr_1fr]">
                  <input
                    placeholder="Full name"
                    value={profile.full_name ?? ""}
                    onChange={(e) => setProfileField({ full_name: e.target.value })}
                    className={cn(fieldClass, "font-serif text-base font-semibold")}
                  />
                  <input
                    placeholder="Title"
                    value={profile.title ?? ""}
                    onChange={(e) => setProfileField({ title: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Short bio"
                  value={profile.bio ?? ""}
                  onChange={(e) => setProfileField({ bio: e.target.value })}
                  className={cn(fieldClass, "resize-y")}
                />
              </div>
            </div>

            <div className="my-4.5 h-px bg-border" />

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <input
                placeholder="Location"
                value={profile.location ?? ""}
                onChange={(e) => setProfileField({ location: e.target.value })}
                className={fieldClass}
              />
              <input
                placeholder="Email"
                value={profile.contact_email ?? ""}
                onChange={(e) => setProfileField({ contact_email: e.target.value })}
                className={fieldClass}
              />
              <input
                placeholder="Phone"
                value={profile.phone ?? ""}
                onChange={(e) => setProfileField({ phone: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <input
                placeholder="GitHub URL"
                value={profile.social_links.github ?? ""}
                onChange={(e) =>
                  setProfileField({ social_links: { ...profile.social_links, github: e.target.value } })
                }
                className={fieldClass}
              />
              <input
                placeholder="LinkedIn URL"
                value={profile.social_links.linkedin ?? ""}
                onChange={(e) =>
                  setProfileField({ social_links: { ...profile.social_links, linkedin: e.target.value } })
                }
                className={fieldClass}
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2.5">
              {profileSaved && <span className="text-[11.5px] text-success-fg">Saved</span>}
              <button
                type="button"
                onClick={onSaveProfile}
                disabled={profileSaving}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-60"
              >
                {profileSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </Card>
        )}

        {tab === "experience" && (
          <Card>
            <div className="flex items-center justify-between">
              <span className="font-serif text-[15px] font-semibold text-foreground">Experience</span>
              <button
                type="button"
                onClick={addExperience}
                className="text-[12.5px] font-semibold text-accent hover:text-accent-hover"
              >
                + Add
              </button>
            </div>
            <div className="mt-3.5 flex flex-col gap-3.5">
              {experience.map((row) => (
                <div key={row.id} className="rounded-[11px] border border-border bg-surface-strong p-4">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <input
                      placeholder="Role"
                      value={row.role}
                      onChange={(e) => patchExperience(row.id, { role: e.target.value })}
                      className={fieldClass}
                    />
                    <input
                      placeholder="Company"
                      value={row.company}
                      onChange={(e) => patchExperience(row.id, { company: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 items-center gap-2.5 sm:grid-cols-[1fr_1fr_auto_auto]">
                    <input
                      type="month"
                      value={isoToMonth(row.start_date)}
                      onChange={(e) => patchExperience(row.id, { start_date: monthToIso(e.target.value) })}
                      className={fieldClass}
                    />
                    <input
                      type="month"
                      value={isoToMonth(row.end_date)}
                      disabled={row.is_current}
                      onChange={(e) => patchExperience(row.id, { end_date: monthToIso(e.target.value) })}
                      className={cn(fieldClass, row.is_current && "opacity-50")}
                    />
                    <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted">
                      <input
                        type="checkbox"
                        checked={row.is_current}
                        onChange={(e) => patchExperience(row.id, { is_current: e.target.checked })}
                        className="accent-accent"
                      />
                      Current
                    </label>
                    <button
                      type="button"
                      onClick={() => requestDelete("experience", row.id)}
                      className="text-xs font-semibold text-danger-fg"
                    >
                      Delete
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Description"
                    value={row.description ?? ""}
                    onChange={(e) => patchExperience(row.id, { description: e.target.value })}
                    className={cn(fieldClass, "mt-2.5 resize-y")}
                  />
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => saveExperience(row.id)}
                      disabled={row.saving}
                      className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-60"
                    >
                      {row.saving ? "Saving…" : row.isNew ? "Insert" : "Save changes"}
                    </button>
                  </div>
                </div>
              ))}
              {experience.length === 0 && (
                <p className="py-3 text-[13px] text-muted">No experience added yet.</p>
              )}
            </div>
          </Card>
        )}

        {tab === "projects" && (
          <Card>
            <div className="flex items-center justify-between">
              <span className="font-serif text-[15px] font-semibold text-foreground">Projects</span>
              <button
                type="button"
                onClick={addProject}
                className="text-[12.5px] font-semibold text-accent hover:text-accent-hover"
              >
                + Add
              </button>
            </div>
            <div className="mt-3.5 flex flex-col gap-3.5">
              {projects.map((row) => (
                <div key={row.id} className="rounded-[11px] border border-border bg-surface-strong p-4">
                  <div className="flex gap-2.5">
                    <input
                      placeholder="Project title"
                      value={row.title}
                      onChange={(e) => patchProject(row.id, { title: e.target.value })}
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => requestDelete("project", row.id)}
                      className="shrink-0 text-xs font-semibold text-danger-fg"
                    >
                      Delete
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Description"
                    value={row.description ?? ""}
                    onChange={(e) => patchProject(row.id, { description: e.target.value })}
                    className={cn(fieldClass, "mt-2.5 resize-y")}
                  />
                  <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <input
                      placeholder="Tech stack, comma separated"
                      value={row.techStackDraft}
                      onChange={(e) => patchProject(row.id, { techStackDraft: e.target.value })}
                      className={fieldClass}
                    />
                    <input
                      placeholder="Impact"
                      value={row.impact ?? ""}
                      onChange={(e) => patchProject(row.id, { impact: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => saveProject(row.id)}
                      disabled={row.saving}
                      className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-60"
                    >
                      {row.saving ? "Saving…" : row.isNew ? "Insert" : "Save changes"}
                    </button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && <p className="py-3 text-[13px] text-muted">No projects added yet.</p>}
            </div>
          </Card>
        )}

        {tab === "skills" && (
          <Card>
            <span className="font-serif text-[15px] font-semibold text-foreground">Skills</span>
            <div className="mt-3.5 flex gap-2.5">
              <input
                placeholder="Type a skill and press Enter"
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                className={fieldClass}
              />
              <button
                type="button"
                onClick={addSkill}
                className="shrink-0 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-accent-foreground"
              >
                Add
              </button>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint py-1.5 pl-3.5 pr-2 text-[13px] font-semibold text-accent"
                >
                  {skill.name}
                  <button
                    type="button"
                    onClick={() => requestDelete("skill", skill.id)}
                    className="px-0.5 text-base leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              {skills.length === 0 && <p className="text-[13px] text-muted">No skills added yet.</p>}
            </div>
          </Card>
        )}

        {tab === "education" && (
          <Card>
            <div className="flex items-center justify-between">
              <span className="font-serif text-[15px] font-semibold text-foreground">Education</span>
              <button
                type="button"
                onClick={addEducation}
                className="text-[12.5px] font-semibold text-accent hover:text-accent-hover"
              >
                + Add
              </button>
            </div>
            <div className="mt-3.5 flex flex-col gap-3.5">
              {education.map((row) => (
                <div key={row.id} className="rounded-[11px] border border-border bg-surface-strong p-4">
                  <div className="flex gap-2.5">
                    <input
                      placeholder="Institution"
                      value={row.institution}
                      onChange={(e) => patchEducation(row.id, { institution: e.target.value })}
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => requestDelete("education", row.id)}
                      className="shrink-0 text-xs font-semibold text-danger-fg"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <input
                      placeholder="Degree"
                      value={row.degree ?? ""}
                      onChange={(e) => patchEducation(row.id, { degree: e.target.value })}
                      className={fieldClass}
                    />
                    <input
                      placeholder="Field"
                      value={row.field ?? ""}
                      onChange={(e) => patchEducation(row.id, { field: e.target.value })}
                      className={fieldClass}
                    />
                    <input
                      type="month"
                      value={isoToMonth(row.start_date)}
                      onChange={(e) => patchEducation(row.id, { start_date: monthToIso(e.target.value) })}
                      className={fieldClass}
                    />
                    <input
                      type="month"
                      value={isoToMonth(row.end_date)}
                      onChange={(e) => patchEducation(row.id, { end_date: monthToIso(e.target.value) })}
                      className={fieldClass}
                    />
                  </div>
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => saveEducation(row.id)}
                      disabled={row.saving}
                      className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-60"
                    >
                      {row.saving ? "Saving…" : row.isNew ? "Insert" : "Save changes"}
                    </button>
                  </div>
                </div>
              ))}
              {education.length === 0 && (
                <p className="py-3 text-[13px] text-muted">No education added yet.</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {confirmTarget && (
        <ConfirmDialog
          title="Delete this entry?"
          description="This can't be undone."
          onCancel={() => setConfirmTarget(null)}
          onConfirm={onConfirmDelete}
        />
      )}
    </div>
  );
}
