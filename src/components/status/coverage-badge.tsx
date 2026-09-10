import type { Coverage } from "@/contracts/domain";

interface CoverageBadgeProps {
  coverage: Coverage;
  className?: string;
}

const coverageConfig: Record<
  Coverage,
  { label: string; bg: string; text: string; border: string; indicator: string }
> = {
  REQUIRED: {
    label: "REQUIRED",
    bg: "bg-teal-50/40",
    text: "text-[#176B67]",
    border: "border-[#176B67]",
    indicator: "[REQ]",
  },
  NOT_APPLICABLE: {
    label: "N/A",
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-300",
    indicator: "[N/A]",
  },
  NOT_IMPLEMENTED: {
    label: "NOT IMPLEMENTED",
    bg: "bg-amber-50/40",
    text: "text-amber-800",
    border: "border-amber-400",
    indicator: "[OMIT]",
  },
  UNVERIFIED: {
    label: "UNVERIFIED",
    bg: "bg-white",
    text: "text-slate-600",
    border: "border-dotted border-slate-400",
    indicator: "[UNV]",
  },
};

export function CoverageBadge({ coverage, className = "" }: CoverageBadgeProps) {
  const config = coverageConfig[coverage] ?? {
    label: coverage,
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-300",
    indicator: "[–]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[11px] uppercase tracking-tight border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="opacity-70 text-[10px]" aria-hidden="true">
        {config.indicator}
      </span>
      <span>{config.label}</span>
    </span>
  );
}

