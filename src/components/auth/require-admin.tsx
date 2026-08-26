"use client";

import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

// Same shape as RequireAuth, plus the role check the Docs call a "UX nicety,
// not the security boundary" (§8) — the backend 403s non-admin tokens on
// every admin endpoint regardless of what this does.
export function RequireAdmin({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const restoring = useAuthStore((state) => state.restoring);
  const router = useRouter();

  useEffect(() => {
    if (restoring) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [restoring, user, router]);

  if (restoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return <>{children}</>;
}
