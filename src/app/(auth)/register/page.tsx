"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Divider } from "@/components/ui/divider";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { ApiError } from "@/lib/api/http";
import { registerSchema, type RegisterValues } from "@/lib/validation/auth";
import { useAuthStore } from "@/store/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function RegisterPage() {
  const router = useRouter();
  const register_ = useAuthStore((state) => state.register);
  const login = useAuthStore((state) => state.login);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", agree: undefined },
  });

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);
    try {
      await register_(values.email, values.password);
      // Registration doesn't return tokens, so sign the new candidate in
      // immediately for a one-step onboarding flow.
      await login(values.email, values.password);
      router.push("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <AuthShell quote="Your chat, your work, your voice — always on.">
      <h1 className="font-serif text-[22px] font-semibold text-foreground">Create your account</h1>
      <p className="mt-1.5 text-[13px] text-muted">Set up your chatfolio in minutes.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 flex flex-col gap-3">
        <TextField
          label="Email address"
          type="email"
          placeholder="Email address"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordField
          label="Password"
          placeholder="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        {!errors.password && (
          <p className="-mt-1.5 text-[11.5px] text-muted-subtle">Use at least 8 characters.</p>
        )}
        <PasswordField
          label="Confirm password"
          placeholder="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Checkbox
          label="I agree to the Terms of Service and Privacy Policy."
          {...register("agree")}
        />
        {errors.agree && <p className="-mt-2 text-xs text-danger-fg">{errors.agree.message}</p>}

        <Button type="submit" loading={isSubmitting} className="mt-1">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>

        {formError && <Alert>{formError}</Alert>}
      </form>

      <div className="mt-5">
        <Divider label="or" />
      </div>
      <div className="mt-1">
        <GoogleAuthButton label="Continue with Google" />
      </div>

      <p className="mt-auto pt-5 text-[12.5px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
