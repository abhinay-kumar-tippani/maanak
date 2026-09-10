import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireActor, AuthorizationError } from "@/server/auth/authorize";
import { Sidebar, Header } from "@/components/layout";

export default async function LabLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  let actor;
  try {
    actor = await requireActor();
  } catch (error) {
    if (
      error instanceof AuthorizationError &&
      (error.code === "AUTH_REQUIRED" || error.code === "PROFILE_REQUIRED")
    ) {
      redirect("/login");
    }
    if (
      error instanceof AuthorizationError &&
      error.code === "CONFIGURATION_ERROR"
    ) {
      redirect("/login?error=config");
    }
    throw error;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* 1. Sidebar navigation with Dashboard, Instruments, Approvals, Reports, Audit Trail */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* 2. Header with NAWI Lab, SIH26035 Prototype, authenticated user display name & role */}
        <Header actor={actor} />

        {/* Workspace viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white text-xs text-slate-500 py-4 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>NAWI Lab &mdash; SIH26035 Prototype</span>
            <span>
              Legal Metrology Non-Automatic Weighing Instruments Laboratory System
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
