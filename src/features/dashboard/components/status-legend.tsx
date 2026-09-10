import { WorkflowBadge } from "@/components/status/workflow-badge";
import { OutcomeBadge } from "@/components/status/outcome-badge";
import { CoverageBadge } from "@/components/status/coverage-badge";
import type { EvaluationState, Outcome, Coverage } from "@/contracts/domain";

export function StatusLegend() {
  const workflowStates: EvaluationState[] = [
    "DRAFT",
    "PLANNED",
    "TESTING",
    "READY_FOR_REVIEW",
    "UNDER_REVIEW",
    "CORRECTION_REQUESTED",
    "APPROVED",
    "REJECTED",
    "ISSUED",
  ];

  const outcomes: Outcome[] = [
    "PASS",
    "FAIL",
    "INCOMPLETE",
    "INVALID",
    "NOT_APPLICABLE",
    "NOT_VERIFIED",
    "NOT_SUPPORTED",
  ];

  const coverageStates: Coverage[] = [
    "REQUIRED",
    "NOT_APPLICABLE",
    "NOT_IMPLEMENTED",
    "UNVERIFIED",
  ];

  return (
    <section
      aria-label="Metrological Status Styles Reference"
      className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs"
    >
      <div className="border-b border-slate-200 pb-3 mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#183153]">
          Metrological &amp; Workflow Visual Reference
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Standardized visual distinctions for evaluation lifecycle, metrological outcomes, and standard coverage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category 1: Workflow State */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-xs font-semibold text-slate-800">
              1. Workflow State
            </span>
            <span className="text-[10px] uppercase font-mono text-slate-400">
              Pill Style
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Lifecycle state machine transitions from DRAFT through ISSUED.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {workflowStates.map((state) => (
              <WorkflowBadge key={state} state={state} />
            ))}
          </div>
        </div>

        {/* Category 2: Test Outcome */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-xs font-semibold text-slate-800">
              2. Test Outcome
            </span>
            <span className="text-[10px] uppercase font-mono text-slate-400">
              Verdict Tag
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Pure metrological rule calculations and tolerance verification.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {outcomes.map((outcome) => (
              <OutcomeBadge key={outcome} outcome={outcome} />
            ))}
          </div>
        </div>

        {/* Category 3: Coverage State */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-xs font-semibold text-slate-800">
              3. Coverage State
            </span>
            <span className="text-[10px] uppercase font-mono text-slate-400">
              Mono Capsule
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            OIML R 76-1:2006 test-catalogue applicability and scope mapping.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {coverageStates.map((coverage) => (
              <CoverageBadge key={coverage} coverage={coverage} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

