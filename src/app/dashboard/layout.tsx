"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { Header } from "@/components/dashboard/header";
import { OnboardingTracker } from "@/components/dashboard/onboarding-tracker";
import { OnboardingTutorial } from "@/components/dashboard/onboarding-tutorial";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { useEntitlementsStore } from "@/store/entitlements-store";
import { useEffect, useState, type ReactNode } from "react";

function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const getValidAccessToken = useAuthStore((state) => state.getValidAccessToken);
  const loadEntitlements = useEntitlementsStore((state) => state.load);

  // The plan drives every lock in the dashboard, so load it once for the shell.
  useEffect(() => {
    void (async () => {
      const token = await getValidAccessToken();
      if (token) await loadEntitlements(token);
    })();
  }, [getValidAccessToken, loadEntitlements]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <OnboardingTracker />
      <OnboardingTutorial />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
