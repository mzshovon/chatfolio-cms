"use client";

import { Alert } from "@/components/ui/alert";
import * as feedbackApi from "@/lib/api/feedback";
import { ApiError } from "@/lib/api/http";
import { cn } from "@/lib/cn";
import { Star, X } from "lucide-react";
import { useState } from "react";

const MAX_MESSAGE_LENGTH = 2000;

export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const displayScore = hoverScore || score;

  const onSubmit = async () => {
    if (score < 1) {
      setError("Pick a star rating first.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await feedbackApi.submitFeedback({ nps_score: score, message: message.trim() || null });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send feedback. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-surface-strong p-7 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-serif text-[22px] font-semibold text-foreground">
            {sent ? "Thank you!" : "Send feedback"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-surface hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <p className="mt-2.5 text-[13.5px] text-muted">
            Your feedback helps us make Chatfolio better. We appreciate you taking the time.
          </p>
        ) : (
          <>
            <p className="mt-1.5 text-[13.5px] text-muted">Tell us how Chatfolio is working for you.</p>

            <div className="mt-6 flex justify-center gap-2.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScore(n)}
                  onMouseEnter={() => setHoverScore(n)}
                  onMouseLeave={() => setHoverScore(0)}
                  className="p-0.5"
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      displayScore >= n ? "fill-accent text-accent" : "fill-transparent text-border"
                    )}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>

            <div className="relative mt-6">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                placeholder="What's working well, or what should we fix?"
                rows={4}
                className="w-full resize-none rounded-[12px] border border-border bg-surface px-4 py-3.5 text-[13.5px] text-foreground outline-none focus:border-accent"
              />
              <span className="pointer-events-none absolute bottom-2.5 right-3.5 text-[11px] text-muted">
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>

            {error && <Alert className="mt-3.5">{error}</Alert>}

            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className={cn(
                "mt-5 w-full rounded-[12px] py-3.5 text-[13.5px] font-semibold transition-colors",
                score >= 1
                  ? "bg-accent text-accent-foreground hover:bg-accent-hover"
                  : "bg-border text-muted",
                submitting && "opacity-70"
              )}
            >
              {submitting ? "Sending…" : "Send feedback"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
