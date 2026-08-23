import { AuthCard } from "@/components/auth/auth-card";
import { Suspense } from "react";
import { ResetPasswordView } from "./reset-password-view";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthCard>{null}</AuthCard>}>
      <ResetPasswordView />
    </Suspense>
  );
}
