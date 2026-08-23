"use client";

import { AuthCard } from "@/components/auth/auth-card";
import { StepDots } from "@/components/auth/step-dots";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { PasswordField } from "@/components/ui/password-field";
import * as authApi from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function ResetPasswordView() {
  const token = useSearchParams().get("token");
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      setFormError("This reset link is missing its token. Request a new one.");
      return;
    }
    setFormError(null);
    try {
      await authApi.resetPassword(token, values.password);
      setDone(true);
    } catch (error) {
      // The backend doesn't distinguish expired / already-used / never-valid
      // tokens (§2.4) — show one generic message for any 401 here.
      setFormError(
        error instanceof ApiError && error.status === 401
          ? "This reset link is no longer valid. Request a new one."
          : error instanceof ApiError
            ? error.message
            : "Something went wrong. Please try again."
      );
    }
  };

  if (done) {
    return (
      <AuthCard>
        <StepDots completedSteps={2} />
        <div className="flex flex-col items-center text-center">
          <IconBadge>✓</IconBadge>
          <h1 className="mt-4 font-serif text-xl font-semibold text-foreground">
            Password updated
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Your password has been changed. Sign in with your new password.
          </p>
          <Link
            href="/login"
            className="mt-5 w-full rounded-[10px] bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            Continue to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <StepDots completedSteps={2} />
      <h1 className="font-serif text-[22px] font-semibold text-foreground">
        Set a new <span className="font-serif italic text-accent">password</span>
      </h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        Choose a strong password you haven&apos;t used before.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 flex flex-col gap-3">
        <PasswordField
          label="New password"
          placeholder="New password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        {!errors.password && (
          <p className="-mt-1.5 text-[11.5px] text-muted-subtle">Use at least 8 characters.</p>
        )}
        <PasswordField
          label="Confirm new password"
          placeholder="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
        {formError && (
          <Alert>
            {formError}{" "}
            {formError.startsWith("This reset link") && (
              <Link href="/forgot-password" className="font-semibold underline">
                Request a new link
              </Link>
            )}
          </Alert>
        )}
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
