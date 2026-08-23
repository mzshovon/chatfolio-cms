"use client";

import { AuthCard } from "@/components/auth/auth-card";
import { OtpInput } from "@/components/auth/otp-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { ApiError } from "@/lib/api/http";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const RESEND_COOLDOWN_SECONDS = 28;

export default function VerifyTwoFactorPage() {
  const router = useRouter();
  const pendingChallenge = useAuthStore((state) => state.pendingChallenge);
  const verifyTwoFactor = useAuthStore((state) => state.verifyTwoFactor);
  const resendTwoFactor = useAuthStore((state) => state.resendTwoFactor);
  const cancelTwoFactor = useAuthStore((state) => state.cancelTwoFactor);

  const [digits, setDigits] = useState<string[]>(() => Array(6).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  // No pending challenge means this screen was reached directly (e.g. a
  // reload) — the challenge token only ever lived in memory, so there's
  // nothing to verify against. Send them back to start login over, same as
  // the doc's guidance for a stalled/expired challenge.
  useEffect(() => {
    if (!pendingChallenge) router.replace("/login");
  }, [pendingChallenge, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : current));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!pendingChallenge) return <AuthCard>{null}</AuthCard>;

  const destinations = pendingChallenge.masked_destinations;
  const destinationText = destinations.length > 1 ? destinations.join(" and ") : destinations[0];

  const onSubmit = async () => {
    const code = digits.join("");
    if (code.length < 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      await verifyTwoFactor(code);
      router.push("/dashboard");
    } catch (err) {
      setVerifying(false);
      setDigits(Array(6).fill(""));
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  const onResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await resendTwoFactor();
      setDigits(Array(6).fill(""));
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  const onBack = () => {
    cancelTwoFactor();
    router.push("/login");
  };

  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center">
        <IconBadge className="bg-accent-tint text-accent">🔒</IconBadge>
        <h1 className="mt-4 font-serif text-xl font-semibold text-foreground">
          Verify it&apos;s <span className="italic text-accent">you</span>
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Enter the 6-digit code sent to{" "}
          <strong className="text-foreground">{destinationText}</strong>
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="mt-6 flex flex-col items-center gap-4"
      >
        <OtpInput
          value={digits}
          onChange={(next) => {
            setDigits(next);
            setError(null);
          }}
          disabled={verifying}
        />

        {error && <Alert className="w-full">{error}</Alert>}

        <Button type="submit" loading={verifying}>
          {verifying ? "Verifying…" : "Verify"}
        </Button>
      </form>

      <p className="mt-4 text-center text-[12.5px] text-muted">
        {cooldown > 0 ? (
          <>Didn&apos;t get a code? Resend in 0:{String(cooldown).padStart(2, "0")}</>
        ) : (
          <>
            Didn&apos;t get a code?{" "}
            <button
              type="button"
              onClick={onResend}
              disabled={resending}
              className="font-semibold text-accent hover:text-accent-hover disabled:opacity-60"
            >
              {resending ? "Sending…" : "Resend"}
            </button>
          </>
        )}
      </p>

      <button
        type="button"
        onClick={onBack}
        className="mt-3 block w-full text-center text-[12.5px] font-medium text-muted hover:text-foreground"
      >
        ← Back to sign in
      </button>
    </AuthCard>
  );
}
