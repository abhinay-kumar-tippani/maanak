import "server-only";

import type { EvaluationState } from "@/contracts/domain";

const transitions: Record<EvaluationState, readonly EvaluationState[]> = {
  DRAFT: ["DRAFT", "PLANNED"],
  PLANNED: ["PLANNED", "TESTING", "DRAFT"],
  TESTING: ["TESTING", "READY_FOR_REVIEW", "DRAFT"],
  READY_FOR_REVIEW: ["READY_FOR_REVIEW", "UNDER_REVIEW", "TESTING"],
  UNDER_REVIEW: ["UNDER_REVIEW", "APPROVED", "CORRECTION_REQUESTED", "REJECTED"],
  CORRECTION_REQUESTED: ["CORRECTION_REQUESTED", "TESTING", "DRAFT"],
  APPROVED: ["APPROVED", "ISSUED"],
  REJECTED: ["REJECTED", "ARCHIVED"],
  ISSUED: ["ISSUED", "ARCHIVED"],
  ARCHIVED: ["ARCHIVED"],
};

export function canTransition(from: EvaluationState, to: EvaluationState): boolean {
  return transitions[from].includes(to);
}

export function assertTransition(from: EvaluationState, to: EvaluationState): void {
  if (!canTransition(from, to)) throw new Error(`INVALID_STATE_TRANSITION:${from}->${to}`);
}

export function expectedNextVersion(current: number): number {
  if (!Number.isSafeInteger(current) || current < 0) throw new Error("INVALID_ROW_VERSION");
  return current + 1;
}
