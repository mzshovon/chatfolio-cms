"use client";

import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const restoring = useAuthStore((state) => state.restoring);
  const router = useRouter();

  useEffect(() => {
    // Wait for the initial silent-restore attempt to resolve before
    // deciding there's no session — otherwise a reload with a still-valid
    // refresh token would bounce to /login before it got a chance to run.
    if (!restoring && !user) router.replace("/login");
  }, [restoring, user, router]);

  if (restoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
