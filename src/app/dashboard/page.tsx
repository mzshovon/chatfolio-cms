"use client";

import { Logo } from "@/components/auth/logo";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";

function DashboardContent() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <Logo variant="default" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="secondary" className="w-auto px-4 py-2" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm font-medium text-accent">Welcome back</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground">
          {user?.email}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Your dashboard — profile, CV, portfolio sections, and recruiter conversations — is
          still under construction. Check back soon.
        </p>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
