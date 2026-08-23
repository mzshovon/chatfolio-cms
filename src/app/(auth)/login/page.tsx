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
import { loginSchema, type LoginValues } from "@/lib/validation/auth";
import { useAuthStore } from "@/store/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      const { requiresTwoFactor } = await login(values.email, values.password);
      router.push(requiresTwoFactor ? "/verify-2fa" : "/dashboard");
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <AuthShell quote="Let your work speak — the AI handles the rest.">
      <h1 className="font-serif text-[22px] font-semibold text-foreground">
        Sign in to your account
      </h1>
      <p className="mt-1.5 text-[13px] text-muted">
        Manage chats, candidates, and portfolio content.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-3">
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" {...register("remember")} />
          <Link href="/forgot-password" className="text-[12.5px] font-medium text-accent hover:text-accent-hover">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="mt-1">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>

        {formError && <Alert>{formError}</Alert>}
      </form>

      <div className="mt-5">
        <Divider label="or" />
      </div>
      <div className="mt-1">
        <GoogleAuthButton label="Continue with Google" />
      </div>

      <p className="mt-auto pt-6 text-[12.5px] text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-accent hover:text-accent-hover">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
