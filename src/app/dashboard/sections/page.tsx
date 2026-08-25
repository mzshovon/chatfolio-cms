"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { SavedFlash } from "@/components/ui/saved-flash";
import { Spinner } from "@/components/ui/spinner";
import { StatusPill } from "@/components/ui/status-pill";
import * as sectionsApi from "@/lib/api/sections";
import { ApiError } from "@/lib/api/http";
import { useAuthedRequest } from "@/lib/hooks/use-authed-request";
import { useSaveFlash } from "@/lib/hooks/use-save-flash";
import { useEffect, useState } from "react";

const TITLES: Record<sectionsApi.SectionType, string> = { intro: "Intro", summary: "Summary" };

export default function PortfolioSectionsPage() {
  const authed = useAuthedRequest();
  const [sections, setSections] = useState<sectionsApi.PortfolioSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const savedFlash = useSaveFlash();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authed((token) => sectionsApi.getSections(token));
        if (!cancelled) setSections(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Couldn't load your sections.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onContentChange = (id: string, content: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)));
  };

  const onSave = async (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    setSavingId(id);
    setError(null);
    try {
      const updated = await authed((token) => sectionsApi.updateSection(token, id, section.content));
      setSections((prev) => prev.map((s) => (s.id === id ? updated : s)));
      savedFlash.flash(id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your edit.");
    } finally {
      setSavingId(null);
    }
  };

  const onRegenerate = async (id: string) => {
    setRegeneratingId(id);
    setError(null);
    try {
      const updated = await authed((token) => sectionsApi.regenerateSection(token, id));
      setSections((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't regenerate this section. Try again shortly."
      );
    } finally {
      setRegeneratingId(null);
    }
  };

  const onApprove = async (id: string) => {
    setError(null);
    try {
      const updated = await authed((token) => sectionsApi.approveSection(token, id));
      setSections((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't approve this section.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const approvedCount = sections.filter((s) => s.status === "approved").length;

  return (
    <div className="mx-auto max-w-[760px] p-8">
      <h1 className="font-serif text-[22px] font-semibold text-foreground">AI-generated sections</h1>
      <p className="mt-1 text-[13px] text-muted">
        These ground what the chat assistant says about you. Both must be approved before you can
        publish.
      </p>

      {error && <Alert className="mt-4">{error}</Alert>}

      <div className="mt-5 flex flex-col gap-4">
        {sections.map((section) => {
          const approved = section.status === "approved";
          const regenerating = regeneratingId === section.id;
          const saving = savingId === section.id;
          return (
            <Card key={section.id}>
              <div className="flex items-center justify-between">
                <span className="text-[14.5px] font-semibold text-foreground">
                  {TITLES[section.section_type]}
                </span>
                <StatusPill tone={approved ? "success" : "accent"}>
                  {approved ? "Approved" : "Draft"}
                </StatusPill>
              </div>

              <textarea
                rows={5}
                value={section.content}
                onChange={(e) => onContentChange(section.id, e.target.value)}
                className="mt-3 w-full resize-y rounded-[9px] border border-border bg-surface-strong px-3.5 py-3 text-[13px] leading-relaxed text-foreground outline-none focus:border-accent"
              />

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11.5px] text-muted">
                  Version {section.version} ·{" "}
                  {section.generated_by === "ai" ? "Generated by AI" : "Manually edited"}
                </span>
                <div className="flex items-center gap-2">
                  <SavedFlash state={savedFlash.get(section.id)} />
                  <button
                    type="button"
                    onClick={() => onRegenerate(section.id)}
                    disabled={regenerating}
                    className="rounded-[7px] border border-border bg-surface-strong px-3.5 py-1.5 text-xs font-semibold text-foreground disabled:opacity-60"
                  >
                    {regenerating ? "Regenerating…" : "Regenerate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSave(section.id)}
                    disabled={saving}
                    className="rounded-[7px] border border-border bg-surface-strong px-3.5 py-1.5 text-xs font-semibold text-foreground disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onApprove(section.id)}
                    disabled={approved}
                    className="rounded-[7px] bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground disabled:cursor-default disabled:bg-border disabled:text-muted"
                  >
                    {approved ? "Approved" : "Approve"}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl bg-accent-tint px-5 py-4">
        <span className="text-[13.5px] font-semibold text-foreground">Publish readiness</span>
        <p className="mt-1.5 text-[12.5px] text-muted">
          {approvedCount} of {sections.length} sections approved
        </p>
      </div>
    </div>
  );
}
