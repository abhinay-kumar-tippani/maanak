import type { EvaluationState } from "@/contracts/domain";

interface WorkflowBadgeProps {
  state: EvaluationState;
  className?: string;
}

const stateConfig: Record<
  EvaluationState,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    dot: "bg-slate-400",
  },
  PLANNED: {
    label: "Planned",
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  TESTING: {
    label: "Testing",
    bg: "bg-blue-50",
    text: "text-[#183153]",
    border: "border-blue-200",
    dot: "bg-[#183153]",
  },
  READY_FOR_REVIEW: {
    label: "Ready for Review",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
    dot: "bg-amber-500",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  CORRECTION_REQUESTED: {
    label: "Correction Requested",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-300",
    dot: "bg-orange-500",
  },
  APPROVED: {
    label: "Approved",
    bg: "bg-teal-50",
    text: "text-[#176B67]",
    border: "border-teal-300",
    dot: "bg-[#176B67]",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-300",
    dot: "bg-rose-500",
  },
  ISSUED: {
    label: "Issued",
    bg: "bg-[#183153]",
    text: "text-white",
    border: "border-[#183153]",
    dot: "bg-teal-400",
  },
  ARCHIVED: {
    label: "Archived",
    bg: "bg-zinc-100",
    text: "text-zinc-600",
    border: "border-zinc-200",
    dot: "bg-zinc-400",
  },
};

export function WorkflowBadge({ state, className = "" }: WorkflowBadgeProps) {
  const config = stateConfig[state] ?? {
    label: state,
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}

