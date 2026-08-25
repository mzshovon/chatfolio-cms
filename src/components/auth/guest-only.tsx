"use client";

import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

// Mirrors RequireAuth but in reverse: a fully authenticated user has no
// business back on the login/register/forgot-password screens, so bounce
// them to the dashboard instead of letting them re-run the auth journey.
export function GuestOnly({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const restoring = useAuthStore((state) => state.restoring);
  const router = useRouter();

  useEffect(() => {
    // Same reasoning as RequireAuth: don't decide "no session" until the
    // initial restore attempt has actually finished.
    if (!restoring && user) router.replace("/dashboard");
  }, [restoring, user, router]);

  // While restoring, hold off rendering the guest page — a session might
  // still turn out to be valid, in which case we're about to redirect away.
  if (restoring) return null;
  if (user) return null;

  return <>{children}</>;
}
