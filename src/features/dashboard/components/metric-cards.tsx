import type { DashboardMetricCounts } from "@/contracts/dashboard";
import {
  Clock,
  FileSearch,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
} from "lucide-react";

interface MetricCardsProps {
  metrics: DashboardMetricCounts;
}

export function MetricCards({ metrics }: MetricCardsProps) {
  const cards = [
    {
      label: "Evaluations in Progress",
      value: metrics.evaluationsInProgress,
      description: "Draft, Planned, Testing & Reopened",
      icon: Clock,
      color: "text-sky-700",
      bg: "bg-sky-50",
      border: "border-sky-200",
    },
    {
      label: "Awaiting Review",
      value: metrics.evaluationsAwaitingReview,
      description: "Frozen snapshots pending review",
      icon: FileSearch,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      label: "Approved",
      value: metrics.approvedEvaluations,
      description: "Approved evaluation reports",
      icon: CheckCircle2,
      color: "text-[#176B67]",
      bg: "bg-teal-50",
      border: "border-teal-200",
    },
    {
      label: "Reports Issued",
      value: metrics.issuedReports,
      description: "Final persistent PDF reports",
      icon: FileCheck,
      color: "text-[#183153]",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
    },
    {
      label: "Failed Current Tests",
      value: metrics.failedCurrentTestResults,
      description: "Latest attempts with FAIL verdict",
      icon: AlertTriangle,
      color: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
    },
  ];

  return (
    <section aria-label="Laboratory Metrics Overview">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {card.label}
                </span>
                <div
                  className={`p-1.5 rounded-md border ${card.bg} ${card.color} ${card.border}`}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
                  {card.value}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

