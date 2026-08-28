"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { Header } from "@/components/dashboard/header";
import { OnboardingTracker } from "@/components/dashboard/onboarding-tracker";
import { OnboardingTutorial } from "@/components/dashboard/onboarding-tutorial";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useState, type ReactNode } from "react";

function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
