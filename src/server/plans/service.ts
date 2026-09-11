import "server-only";
import type { ActionResult } from "@/contracts/domain";
import type { SavedTestPlan } from "@/contracts/plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActor, requireAssignedTester } from "@/server/auth/authorize";
import { createPlanCommand } from "@/server/db/commands";
import { assertTransition } from "@/server/workflow/state-machine";
import { normalizeSpecification } from "@/domain/oiml/schemas/specifications";
import { generateTestPlan } from "@/domain/oiml/plans/generate";
import { planRequestSchema, rowVersionSchema } from "./dto";
import { mapPlanError, planError } from "./errors";

export async function createTestPlanService(input: unknown): Promise<ActionResult<SavedTestPlan>> {
  const parsed = planRequestSchema.safeParse(input);
  if (!parsed.success) return planError("VALIDATION_ERROR", "Supply an evaluation ID and a valid expected row version only.");
  try {
    const client = await createSupabaseServerClient();
    if (!client) return planError("CONFIGURATION_ERROR", "Authentication is not configured.");
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) return planError("AUTH_REQUIRED", "Sign in to create a test plan.");
    const actor = await requireActor();
    if (actor.id !== userData.user.id) return planError("AUTH_REQUIRED", "The authenticated identity changed. Sign in again.");
    await requireAssignedTester(actor, parsed.data.evaluationId);
    const { data: evaluation, error } = await client.from("evaluations")
      .select("id,state,row_version::text,current_specification_id,current_plan_id")
      .eq("id", parsed.data.evaluationId).single();
    if (error || !evaluation) return planError("PERMISSION_DENIED", "The evaluation is unavailable.");
    const version = rowVersionSchema.parse(evaluation.row_version);
    if (version !== parsed.data.expectedRowVersion) return planError("STALE_DATA", "Reload the evaluation before creating a plan.");
    if (evaluation.state !== "DRAFT") return planError("PLAN_STATE_LOCKED", "Create a plan only from DRAFT after saving specifications.");
    if (evaluation.current_plan_id) return planError("PLAN_ALREADY_EXISTS", "A current plan already exists.");
    if (!evaluation.current_specification_id) return planError("SPECIFICATION_REQUIRED", "Save a complete specification revision first.");
    assertTransition("DRAFT", "PLANNED");
    const { data: row, error: specError } = await client.from("specification_revisions")
      .select("id,version_no,accuracy_class,max_g::text,min_g::text,e_g::text,d_g::text,features")
      .eq("id", evaluation.current_specification_id).eq("evaluation_id", evaluation.id).single();
    if (specError || !row) return planError("SPECIFICATION_REQUIRED", "The current specification revision is unavailable.");
    let specification;
    try { specification = normalizeSpecification(row); }
    catch { return planError("INVALID_SPECIFICATION", "The saved revision has missing or invalid declarations. Save a complete revision before planning."); }
    const generated = generateTestPlan(specification);
    if (!generated.ok) return { ok: false, error: { code: generated.code, message: generated.issues.map(i=>`${i.code}: ${i.message}`).join(" ") } };
    return await createPlanCommand(actor, parsed.data.evaluationId, version, generated.plan);
  } catch (error) { return mapPlanError(error); }
}
