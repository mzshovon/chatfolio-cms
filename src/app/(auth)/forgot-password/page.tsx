"use client";

import { AuthCard } from "@/components/auth/auth-card";
import { StepDots } from "@/components/auth/step-dots";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { TextField } from "@/components/ui/text-field";
import * as authApi from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [resendError, setResendError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (values: ForgotPasswordValues) => {
    setFormError(null);
    try {
      // Always 204, whether or not the email is registered — the backend
      // never reveals which emails exist, so the UI shows the same
      // "check your inbox" state unconditionally on success.
      await authApi.forgotPassword(values.email);
      setSentTo(values.email);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Something went wrong. Please try again."
      );
    }
  };

  const onResend = async () => {
    const email = sentTo ?? getValues("email");
    if (!email || resendState === "sending") return;
    setResendState("sending");
    setResendError(null);
    try {
      await authApi.forgotPassword(email);
      setResendState("sent");
      setTimeout(() => setResendState("idle"), 2000);
    } catch (error) {
      setResendState("idle");
      setResendError(
        error instanceof ApiError ? error.message : "Something went wrong. Please try again."
      );
    }
  };

  if (sentTo) {
    return (
      <AuthCard>
        <StepDots completedSteps={2} />
        <div className="flex flex-col items-center text-center">
          <IconBadge>✉️</IconBadge>
          <h1 className="mt-4 font-serif text-xl font-semibold text-foreground">
            Check your inbox
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            We sent a password reset link to{" "}
            <strong className="text-foreground">{sentTo}</strong>. The link expires in 30
            minutes.
          </p>
          <Button
            type="button"
            variant="secondary"
            loading={resendState === "sending"}
            onClick={onResend}
            className="mt-5"
          >
            {resendState === "sent" ? "Email resent" : "Resend email"}
          </Button>
          {resendError && (
            <Alert className="mt-3 w-full">{resendError}</Alert>
          )}
          <Link
            href="/login"
            className="mt-4 text-[12.5px] font-medium text-accent hover:text-accent-hover"
          >
            ← Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <StepDots completedSteps={1} />
      <h1 className="font-serif text-[22px] font-semibold text-foreground">
        Forgot your password?
      </h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        No worries. Tell us your account email and we&apos;ll send instructions to reset it.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 flex flex-col gap-3">
        <TextField
          label="Email address"
          type="email"
          placeholder="Email address"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
        {formError && <Alert>{formError}</Alert>}
      </form>

      <p className="mt-4 text-center text-[12.5px] text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
