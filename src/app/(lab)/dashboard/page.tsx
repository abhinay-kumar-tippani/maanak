import { getDashboard } from "@/server/queries/dashboard";
import {
  MetricCards,
  RecentActivityTable,
  StatusLegend,
} from "@/features/dashboard/components";
import { redirect } from "next/navigation";
import { AuthorizationError } from "@/server/auth/authorize";

export default async function DashboardPage() {
  let data;
  try {
    data = await getDashboard();
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
    <div className="space-y-6">
      {/* Dashboard Top Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#183153]">
                Legal Metrology Laboratory Overview
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                Live Metrology Engine
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Type Evaluation Test Report System under OIML R 76-1:2006 &amp; R 76-2:2007.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Metric Cards */}
      <MetricCards metrics={data.metrics} />

      {/* 4 & 5. Recent Activity Table with Honest Empty State */}
      <RecentActivityTable events={data.recentAuditEvents} />

      {/* 6. Visual Reference for Workflow State, Test Outcome, and Coverage State */}
      <StatusLegend />
    </div>
  );
}
