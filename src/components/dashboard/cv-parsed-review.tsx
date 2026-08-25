"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { SavedFlash } from "@/components/ui/saved-flash";
import { Spinner } from "@/components/ui/spinner";
import { StatusPill } from "@/components/ui/status-pill";
import * as cvApi from "@/lib/api/cv";
import { ApiError } from "@/lib/api/http";
import * as profileApi from "@/lib/api/profile";
import { isoToMonth, monthToIso } from "@/lib/date";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useSaveFlash } from "@/lib/hooks/use-save-flash";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

const fieldClass =
  "w-full rounded-[9px] border border-border bg-surface-strong px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent";

type ItemStatus = "pending" | "adding" | "added" | "exists" | "error";

type Draft<T> = {
  key: string;
  data: T;
  status: ItemStatus;
  errorMessage?: string;
};

function draftsFrom<T>(items: T[]): Draft<T>[] {
  return items.map((data, i) => ({ key: `p${i}`, data, status: "pending" }));
}

type BasicFieldKey = "full_name" | "title" | "bio" | "location" | "contact_email" | "phone";

const BASIC_FIELDS: { key: BasicFieldKey; label: string; multiline?: boolean }[] = [
  { key: "full_name", label: "Full name" },
  { key: "title", label: "Title" },
  { key: "bio", label: "Bio", multiline: true },
  { key: "location", label: "Location" },
  { key: "contact_email", label: "Email" },
  { key: "phone", label: "Phone" },
];

export function CvParsedReview({ parsed }: { parsed: cvApi.ParsedProfile }) {
  const authed = useAuthedRequest();
  const savedFlash = useSaveFlash();

  const [dismissed, setDismissed] = useState(false);
  const [loadingContext, setLoadingContext] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Basic info
  const [basic, setBasic] = useState<Record<BasicFieldKey, string>>({
    full_name: parsed.full_name ?? "",
    title: parsed.title ?? "",
    bio: parsed.bio ?? "",
    location: parsed.location ?? "",
    contact_email: parsed.contact_email ?? "",
    phone: parsed.phone ?? "",
  });
  const [basicApply, setBasicApply] = useState<Record<BasicFieldKey, boolean>>({
    full_name: false,
    title: false,
    bio: false,
    location: false,
    contact_email: false,
    phone: false,
  });
  const [socialPairs, setSocialPairs] = useState<{ key: string; value: string; apply: boolean }[]>(
    []
  );
  const [existingProfile, setExistingProfile] = useState<profileApi.Profile | null>(null);
  const [basicSaving, setBasicSaving] = useState(false);
  const [basicError, setBasicError] = useState<string | null>(null);

  // Lists
  const [experienceDrafts, setExperienceDrafts] = useState<Draft<profileApi.ExperienceInput>[]>(
    []
  );
  const [projectDrafts, setProjectDrafts] = useState<
    Draft<Omit<profileApi.ProjectInput, "tech_stack"> & { techStackDraft: string }>[]
  >([]);
  const [skillDrafts, setSkillDrafts] = useState<Draft<profileApi.SkillInput>[]>([]);
  const [educationDrafts, setEducationDrafts] = useState<Draft<profileApi.EducationInput>[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profile, existingSkills] = await Promise.all([
          authed((token) => profileApi.getProfile(token)),
          authed((token) => profileApi.listSkills(token)),
        ]);
        if (cancelled) return;

        setExistingProfile(profile);
        setBasicApply({
          full_name: !profile.full_name,
          title: !profile.title,
          bio: !profile.bio,
          location: !profile.location,
          contact_email: !profile.contact_email,
          phone: !profile.phone,
        });
        // Normalize parsed platform names ("Linkedin") to the lowercase keys
        // the rest of the app uses ("linkedin"), so applying doesn't create
        // a second, differently-cased entry alongside an existing one.
        setSocialPairs(
          Object.entries(parsed.social_links ?? {}).map(([key, value]) => ({
            key: key.trim().toLowerCase(),
            value,
            apply: !profile.social_links[key.trim().toLowerCase()],
          }))
        );

        const existingSkillNames = new Set(existingSkills.map((s) => s.name.trim().toLowerCase()));
        setSkillDrafts(
          (parsed.skills ?? []).map((skill, i) => ({
            key: `s${i}`,
            data: skill,
            status: existingSkillNames.has(skill.name.trim().toLowerCase()) ? "exists" : "pending",
          }))
        );

        setExperienceDrafts(draftsFrom(parsed.experience ?? []));
        setProjectDrafts(
          draftsFrom(
            (parsed.projects ?? []).map((p) => ({ ...p, techStackDraft: p.tech_stack.join(", ") }))
          )
        );
        setEducationDrafts(draftsFrom(parsed.education ?? []));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Couldn't load your current profile.");
        }
      } finally {
        if (!cancelled) setLoadingContext(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dismissed) return null;

  const applyBasicInfo = async () => {
    setBasicSaving(true);
    setBasicError(null);
    const patch: profileApi.ProfilePatch = {};
    for (const field of BASIC_FIELDS) {
      if (basicApply[field.key]) patch[field.key] = basic[field.key] || null;
    }
    const selectedSocial = socialPairs.filter((p) => p.apply);
    if (selectedSocial.length > 0) {
      patch.social_links = {
        ...(existingProfile?.social_links ?? {}),
        ...Object.fromEntries(selectedSocial.map((p) => [p.key, p.value])),
      };
    }
    if (Object.keys(patch).length === 0) {
      setBasicSaving(false);
      return;
    }
    try {
      const updated = await authed((token) => profileApi.updateProfile(token, patch));
      setExistingProfile(updated);
      savedFlash.flash("basic");
    } catch (err) {
      setBasicError(err instanceof ApiError ? err.message : "Couldn't apply these changes.");
    } finally {
      setBasicSaving(false);
    }
  };

  const addExperience = async (key: string) => {
    const item = experienceDrafts.find((d) => d.key === key);
    if (!item) return;
    setExperienceDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, status: "adding" } : d)));
    try {
      await authed((token) => profileApi.createExperience(token, item.data));
      setExperienceDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, status: "added" } : d)));
    } catch (err) {
      setExperienceDrafts((prev) =>
        prev.map((d) =>
          d.key === key
            ? {
                ...d,
                status: "error",
                errorMessage: err instanceof ApiError ? err.message : "Couldn't add this entry.",
              }
            : d
        )
      );
    }
  };

  const addProject = async (key: string) => {
    const item = projectDrafts.find((d) => d.key === key);
    if (!item) return;
    setProjectDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, status: "adding" } : d)));
    try {
      const { techStackDraft, ...rest } = item.data;
      const input: profileApi.ProjectInput = {
        ...rest,
        tech_stack: techStackDraft
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      await authed((token) => profileApi.createProject(token, input));
      setProjectDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, status: "added" } : d)));
    } catch (err) {
      setProjectDrafts((prev) =>
        prev.map((d) =>
          d.key === key
            ? {
                ...d,
                status: "error",
                errorMessage: err instanceof ApiError ? err.message : "Couldn't add this entry.",
              }
            : d
        )
      );
    }
  };

  const addSkill = async (key: string) => {
    const item = skillDrafts.find((d) => d.key === key);
    if (!item) return;
    setSkillDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, status: "adding" } : d)));
    try {
      await authed((token) => profileApi.createSkill(token, item.data));
      setSkillDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, status: "added" } : d)));
    } catch (err) {
      setSkillDrafts((prev) =>
        prev.map((d) =>
          d.key === key
            ? {
                ...d,
                status: "error",
                errorMessage: err instanceof ApiError ? err.message : "Couldn't add this skill.",
              }
            : d
        )
      );
    }
  };

  const addEducation = async (key: string) => {
    const item = educationDrafts.find((d) => d.key === key);
    if (!item) return;
    setEducationDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, status: "adding" } : d)));
    try {
      await authed((token) => profileApi.createEducation(token, item.data));
      setEducationDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, status: "added" } : d)));
    } catch (err) {
      setEducationDrafts((prev) =>
        prev.map((d) =>
          d.key === key
            ? {
                ...d,
                status: "error",
                errorMessage: err instanceof ApiError ? err.message : "Couldn't add this entry.",
              }
            : d
        )
      );
    }
  };

  const addAllExperience = () => experienceDrafts.filter((d) => d.status === "pending" || d.status === "error").forEach((d) => addExperience(d.key));
  const addAllProjects = () => projectDrafts.filter((d) => d.status === "pending" || d.status === "error").forEach((d) => addProject(d.key));
  const addAllSkills = () => skillDrafts.filter((d) => d.status === "pending" || d.status === "error").forEach((d) => addSkill(d.key));
  const addAllEducation = () => educationDrafts.filter((d) => d.status === "pending" || d.status === "error").forEach((d) => addEducation(d.key));

  const hasExperience = experienceDrafts.length > 0;
  const hasProjects = projectDrafts.length > 0;
  const hasSkills = skillDrafts.length > 0;
  const hasEducation = educationDrafts.length > 0;

  if (loadingContext) {
    return (
      <Card className="mt-5 flex items-center justify-center py-10 animate-fade-slide-in">
        <Spinner />
      </Card>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-4 animate-fade-slide-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Review what we found
          </h2>
          <p className="mt-1 text-[12.5px] text-muted">
            Nothing here is saved automatically — edit anything you&apos;d like, then add it to
            your profile.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-[12.5px] font-medium text-muted hover:text-foreground"
        >
          Dismiss
        </button>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Basic info */}
      <Card>
        <span className="text-[14px] font-semibold text-foreground">Basic info</span>
        <div className="mt-3.5 flex flex-col gap-3">
          {BASIC_FIELDS.map((field) => (
            <label key={field.key} className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={basicApply[field.key]}
                onChange={(e) =>
                  setBasicApply((prev) => ({ ...prev, [field.key]: e.target.checked }))
                }
                className="mt-3 shrink-0 accent-accent"
              />
              <div className="flex-1">
                <div className="mb-1 text-[11.5px] text-muted">{field.label}</div>
                {field.multiline ? (
                  <textarea
                    rows={2}
                    value={basic[field.key]}
                    onChange={(e) => setBasic((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className={cn(fieldClass, "resize-y")}
                  />
                ) : (
                  <input
                    value={basic[field.key]}
                    onChange={(e) => setBasic((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className={fieldClass}
                  />
                )}
              </div>
            </label>
          ))}

          {socialPairs.map((pair, i) => (
            <label key={pair.key} className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={pair.apply}
                onChange={(e) =>
                  setSocialPairs((prev) =>
                    prev.map((p, idx) => (idx === i ? { ...p, apply: e.target.checked } : p))
                  )
                }
                className="mt-3 shrink-0 accent-accent"
              />
              <div className="flex-1">
                <div className="mb-1 text-[11.5px] capitalize text-muted">{pair.key}</div>
                <input
                  value={pair.value}
                  onChange={(e) =>
                    setSocialPairs((prev) =>
                      prev.map((p, idx) => (idx === i ? { ...p, value: e.target.value } : p))
                    )
                  }
                  className={fieldClass}
                />
              </div>
            </label>
          ))}
        </div>

        {basicError && <Alert className="mt-3">{basicError}</Alert>}

        <div className="mt-4 flex items-center justify-end gap-2.5">
          <SavedFlash state={savedFlash.get("basic")} />
          <button
            type="button"
            onClick={applyBasicInfo}
            disabled={basicSaving}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-60"
          >
            {basicSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </Card>

      {/* Experience */}
      {hasExperience && (
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-foreground">Experience</span>
            <button
              type="button"
              onClick={addAllExperience}
              className="text-[12.5px] font-semibold text-accent hover:text-accent-hover"
            >
              Add all
            </button>
          </div>
          <div className="mt-3.5 flex flex-col gap-3.5">
            {experienceDrafts.map((d) => (
              <div key={d.key} className="rounded-[11px] border border-border bg-surface-strong p-4">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <input
                    placeholder="Role"
                    value={d.data.role}
                    disabled={d.status === "added"}
                    onChange={(e) =>
                      setExperienceDrafts((prev) =>
                        prev.map((x) =>
                          x.key === d.key ? { ...x, data: { ...x.data, role: e.target.value } } : x
                        )
                      )
                    }
                    className={cn(fieldClass, d.status === "added" && "opacity-60")}
                  />
                  <input
                    placeholder="Company"
                    value={d.data.company}
                    disabled={d.status === "added"}
                    onChange={(e) =>
                      setExperienceDrafts((prev) =>
                        prev.map((x) =>
                          x.key === d.key
                            ? { ...x, data: { ...x.data, company: e.target.value } }
                            : x
                        )
                      )
                    }
                    className={cn(fieldClass, d.status === "added" && "opacity-60")}
                  />
                </div>
                <div className="mt-2.5 grid grid-cols-2 items-center gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    type="month"
                    value={isoToMonth(d.data.start_date)}
                    disabled={d.status === "added"}
                    onChange={(e) =>
                      setExperienceDrafts((prev) =>
                        prev.map((x) =>
                          x.key === d.key
                            ? { ...x, data: { ...x.data, start_date: monthToIso(e.target.value) } }
                            : x
                        )
                      )
                    }
                    className={cn(fieldClass, d.status === "added" && "opacity-60")}
                  />
                  <input
                    type="month"
                    value={isoToMonth(d.data.end_date)}
                    disabled={d.status === "added" || d.data.is_current}
                    onChange={(e) =>
                      setExperienceDrafts((prev) =>
                        prev.map((x) =>
                          x.key === d.key
                            ? { ...x, data: { ...x.data, end_date: monthToIso(e.target.value) } }
                            : x
                        )
                      )
                    }
                    className={cn(
                      fieldClass,
                      (d.status === "added" || d.data.is_current) && "opacity-60"
                    )}
                  />
                  <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={d.data.is_current}
                      disabled={d.status === "added"}
                      onChange={(e) =>
                        setExperienceDrafts((prev) =>
                          prev.map((x) =>
                            x.key === d.key
                              ? { ...x, data: { ...x.data, is_current: e.target.checked } }
                              : x
                          )
                        )
                      }
                      className="accent-accent"
                    />
                    Current
                  </label>
                </div>
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={d.data.description ?? ""}
                  disabled={d.status === "added"}
                  onChange={(e) =>
                    setExperienceDrafts((prev) =>
                      prev.map((x) =>
                        x.key === d.key
                          ? { ...x, data: { ...x.data, description: e.target.value } }
                          : x
                      )
                    )
                  }
                  className={cn(fieldClass, "mt-2.5 resize-y", d.status === "added" && "opacity-60")}
                />
                {d.status === "error" && d.errorMessage && (
                  <p className="mt-2 text-xs text-danger-fg">{d.errorMessage}</p>
                )}
                <div className="mt-2.5 flex items-center justify-end gap-2.5">
                  {d.status === "added" ? (
                    <StatusPill tone="success">Added ✓</StatusPill>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setExperienceDrafts((prev) => prev.filter((x) => x.key !== d.key))
                        }
                        className="text-xs font-semibold text-muted hover:text-foreground"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => addExperience(d.key)}
                        disabled={d.status === "adding"}
                        className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-60"
                      >
                        {d.status === "adding" ? "Adding…" : "Add to profile"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Projects */}
      {hasProjects && (
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-foreground">Projects</span>
            <button
              type="button"
              onClick={addAllProjects}
              className="text-[12.5px] font-semibold text-accent hover:text-accent-hover"
            >
              Add all
            </button>
          </div>
          <div className="mt-3.5 flex flex-col gap-3.5">
            {projectDrafts.map((d) => (
              <div key={d.key} className="rounded-[11px] border border-border bg-surface-strong p-4">
                <input
                  placeholder="Project title"
                  value={d.data.title}
                  disabled={d.status === "added"}
                  onChange={(e) =>
                    setProjectDrafts((prev) =>
                      prev.map((x) =>
                        x.key === d.key ? { ...x, data: { ...x.data, title: e.target.value } } : x
                      )
                    )
                  }
                  className={cn(fieldClass, d.status === "added" && "opacity-60")}
                />
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={d.data.description ?? ""}
                  disabled={d.status === "added"}
                  onChange={(e) =>
                    setProjectDrafts((prev) =>
                      prev.map((x) =>
                        x.key === d.key
                          ? { ...x, data: { ...x.data, description: e.target.value } }
                          : x
                      )
                    )
                  }
                  className={cn(fieldClass, "mt-2.5 resize-y", d.status === "added" && "opacity-60")}
                />
                <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <input
                    placeholder="Tech stack, comma separated"
                    value={d.data.techStackDraft}
                    disabled={d.status === "added"}
                    onChange={(e) =>
                      setProjectDrafts((prev) =>
                        prev.map((x) =>
                          x.key === d.key
                            ? { ...x, data: { ...x.data, techStackDraft: e.target.value } }
                            : x
                        )
                      )
                    }
                    className={cn(fieldClass, d.status === "added" && "opacity-60")}
                  />
                  <input
                    placeholder="Impact"
                    value={d.data.impact ?? ""}
                    disabled={d.status === "added"}
                    onChange={(e) =>
                      setProjectDrafts((prev) =>
                        prev.map((x) =>
                          x.key === d.key ? { ...x, data: { ...x.data, impact: e.target.value } } : x
                        )
                      )
                    }
                    className={cn(fieldClass, d.status === "added" && "opacity-60")}
                  />
                </div>
                {d.status === "error" && d.errorMessage && (
                  <p className="mt-2 text-xs text-danger-fg">{d.errorMessage}</p>
                )}
                <div className="mt-2.5 flex items-center justify-end gap-2.5">
                  {d.status === "added" ? (
                    <StatusPill tone="success">Added ✓</StatusPill>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setProjectDrafts((prev) => prev.filter((x) => x.key !== d.key))}
                        className="text-xs font-semibold text-muted hover:text-foreground"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => addProject(d.key)}
                        disabled={d.status === "adding"}
                        className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-60"
                      >
                        {d.status === "adding" ? "Adding…" : "Add to profile"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Skills */}
      {hasSkills && (
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-foreground">Skills</span>
            <button
              type="button"
              onClick={addAllSkills}
              className="text-[12.5px] font-semibold text-accent hover:text-accent-hover"
            >
              Add all
            </button>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {skillDrafts.map((d) => (
              <span
                key={d.key}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full py-1.5 pl-3.5 pr-2 text-[13px] font-semibold",
                  d.status === "added" && "bg-success-bg text-success-fg",
                  d.status === "exists" && "bg-border text-muted",
                  (d.status === "pending" || d.status === "adding" || d.status === "error") &&
                    "bg-accent-tint text-accent"
                )}
                title={d.status === "error" ? d.errorMessage : undefined}
              >
                {d.data.name}
                {d.status === "added" && " ✓"}
                {d.status === "exists" && " (already have it)"}
                {(d.status === "pending" || d.status === "error") && (
                  <button
                    type="button"
                    onClick={() => addSkill(d.key)}
                    className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground"
                  >
                    Add
                  </button>
                )}
                {d.status === "adding" && <Spinner className="h-3 w-3" />}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Education */}
      {hasEducation && (
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-foreground">Education</span>
            <button
              type="button"
              onClick={addAllEducation}
              className="text-[12.5px] font-semibold text-accent hover:text-accent-hover"
            >
              Add all
            </button>
          </div>
          <div className="mt-3.5 flex flex-col gap-3.5">
            {educationDrafts.map((d) => (
              <div key={d.key} className="rounded-[11px] border border-border bg-surface-strong p-4">
                <input
                  placeholder="Institution"
                  value={d.data.institution}
                  disabled={d.status === "added"}
                  onChange={(e) =>
                    setEducationDrafts((prev) =>
                      prev.map((x) =>
                        x.key === d.key
                          ? { ...x, data: { ...x.data, institution: e.target.value } }
                          : x
                      )
                    )
                  }
                  className={cn(fieldClass, d.status === "added" && "opacity-60")}
                />
                <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <input
                    placeholder="Degree"
                    value={d.data.degree ?? ""}
                    disabled={d.status === "added"}
                    onChange={(e) =>
                      setEducationDrafts((prev) =>
                        prev.map((x) =>
                          x.key === d.key ? { ...x, data: { ...x.data, degree: e.target.value } } : x
                        )
                      )
                    }
                    className={cn(fieldClass, d.status === "added" && "opacity-60")}
                  />
                  <input
                    placeholder="Field"
                    value={d.data.field ?? ""}
                    disabled={d.status === "added"}
                    onChange={(e) =>
                      setEducationDrafts((prev) =>
                        prev.map((x) =>
                          x.key === d.key ? { ...x, data: { ...x.data, field: e.target.value } } : x
                        )
                      )
                    }
                    className={cn(fieldClass, d.status === "added" && "opacity-60")}
                  />
                  <input
                    type="month"
                    value={isoToMonth(d.data.start_date)}
                    disabled={d.status === "added"}
                    onChange={(e) =>
                      setEducationDrafts((prev) =>
                        prev.map((x) =>
                          x.key === d.key
                            ? { ...x, data: { ...x.data, start_date: monthToIso(e.target.value) } }
                            : x
                        )
                      )
                    }
                    className={cn(fieldClass, d.status === "added" && "opacity-60")}
                  />
                  <input
                    type="month"
                    value={isoToMonth(d.data.end_date)}
                    disabled={d.status === "added"}
                    onChange={(e) =>
                      setEducationDrafts((prev) =>
                        prev.map((x) =>
                          x.key === d.key
                            ? { ...x, data: { ...x.data, end_date: monthToIso(e.target.value) } }
                            : x
                        )
                      )
                    }
                    className={cn(fieldClass, d.status === "added" && "opacity-60")}
                  />
                </div>
                {d.status === "error" && d.errorMessage && (
                  <p className="mt-2 text-xs text-danger-fg">{d.errorMessage}</p>
                )}
                <div className="mt-2.5 flex items-center justify-end gap-2.5">
                  {d.status === "added" ? (
                    <StatusPill tone="success">Added ✓</StatusPill>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setEducationDrafts((prev) => prev.filter((x) => x.key !== d.key))
                        }
                        className="text-xs font-semibold text-muted hover:text-foreground"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => addEducation(d.key)}
                        disabled={d.status === "adding"}
                        className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-60"
                      >
                        {d.status === "adding" ? "Adding…" : "Add to profile"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
