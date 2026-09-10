import type { Outcome } from "@/contracts/domain";

interface OutcomeBadgeProps {
  outcome: Outcome;
  className?: string;
}

const outcomeConfig: Record<
  Outcome,
  { label: string; bg: string; text: string; border: string; prefix: string }
> = {
  PASS: {
    label: "PASS",
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    border: "border-emerald-500",
    prefix: "✓",
  },
  FAIL: {
    label: "FAIL",
    bg: "bg-rose-50",
    text: "text-rose-900",
    border: "border-rose-500",
    prefix: "✗",
  },
  INCOMPLETE: {
    label: "INCOMPLETE",
    bg: "bg-amber-50",
    text: "text-amber-900",
    border: "border-dashed border-amber-400",
    prefix: "○",
  },
  INVALID: {
    label: "INVALID",
    bg: "bg-purple-50",
    text: "text-purple-900",
    border: "border-purple-400",
    prefix: "⚠",
  },
  NOT_APPLICABLE: {
    label: "N/A",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-300",
    prefix: "–",
  },
  NOT_VERIFIED: {
    label: "NOT VERIFIED",
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    border: "border-zinc-300",
    prefix: "?",
  },
  NOT_SUPPORTED: {
    label: "NOT SUPPORTED",
    bg: "bg-orange-50",
    text: "text-orange-900",
    border: "border-orange-400",
    prefix: "⊘",
  },
};

export function OutcomeBadge({ outcome, className = "" }: OutcomeBadgeProps) {
  const config = outcomeConfig[outcome] ?? {
    label: outcome,
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    prefix: "•",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="font-mono text-[11px] leading-none" aria-hidden="true">
        {config.prefix}
      </span>
      <span>{config.label}</span>
    </span>
  );
}

