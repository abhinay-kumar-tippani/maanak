import "server-only";
import { z } from "zod";
import type { ActionResult } from "@/contracts/domain";
import type { SavedTestPlan } from "@/contracts/plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActor } from "@/server/auth/authorize";
import { parseSavedPlan, rowVersionSchema } from "./dto";
import { mapPlanError, planError } from "./errors";

export async function getTestPlan(evaluationId: string): Promise<ActionResult<SavedTestPlan | null>> {
  if (!z.uuid().safeParse(evaluationId).success) return planError("VALIDATION_ERROR", "A valid evaluation ID is required.");
  try {
    await requireActor();
    const client = await createSupabaseServerClient();
    if (!client) return planError("CONFIGURATION_ERROR", "Authentication is not configured.");
    const { data: evaluation, error } = await client.from("evaluations")
      .select("current_plan_id,row_version::text").eq("id",evaluationId).maybeSingle();
    if (error) throw error;
    if (!evaluation) return planError("PERMISSION_DENIED", "The evaluation is unavailable.");
    const version = rowVersionSchema.parse(evaluation.row_version);
    if (!evaluation.current_plan_id) return { ok: true, data: null, version };
    const { data: row, error: planErrorResult } = await client.from("test_plans")
      .select("id,evaluation_id,version_no,created_at,created_by,plan_snapshot")
      .eq("id",evaluation.current_plan_id).eq("evaluation_id",evaluationId).single();
    if (planErrorResult || !row) throw planErrorResult;
    const plan = parseSavedPlan({ id: row.id, evaluationId: row.evaluation_id, versionNo: row.version_no, createdAt: row.created_at, createdBy: row.created_by, plan: row.plan_snapshot });
    return { ok: true, data: plan, version };
  } catch (error) { return mapPlanError(error); }
}
