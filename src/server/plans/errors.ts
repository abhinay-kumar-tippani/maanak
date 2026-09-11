import "server-only";
import type { ActionResult } from "@/contracts/domain";
import { AuthorizationError } from "@/server/auth/authorize";

export function planError(code: string, message: string): Extract<ActionResult<never>, { ok: false }> {
  return { ok: false, error: { code, message } };
}
export function mapPlanError(error: unknown): Extract<ActionResult<never>, { ok: false }> {
  if (error instanceof AuthorizationError) return planError("PERMISSION_DENIED", "An active assigned tester is required for this operation.");
  const record = error && typeof error === "object" ? error as Record<string, unknown> : {};
  // Only known codes/messages select static safe strings; raw database detail is never returned or logged.
  const message = typeof record.message === "string" ? record.message : "";
  if (record.code === "40001" || message === "STALE_DATA") return planError("STALE_DATA", "The evaluation or specification changed. Reload before creating a plan.");
  if (record.code === "42501") return planError("PERMISSION_DENIED", "You are not permitted to create a plan for this evaluation.");
  if (message === "PLAN_STATE_LOCKED") return planError("PLAN_STATE_LOCKED", "Create a plan only from DRAFT after saving a specification revision.");
  if (message === "PLAN_ALREADY_EXISTS") return planError("PLAN_ALREADY_EXISTS", "A current plan already exists. Reload the evaluation.");
  if (message === "REFERENCE_DATA_MISSING") return planError("REFERENCE_DATA_MISSING", "The versioned planning reference data has not been installed.");
  return planError("PLAN_FAILED", "The test plan could not be loaded or saved.");
}
