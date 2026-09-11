"use server";

import type { ActionResult } from "@/contracts/domain";
import type { CreateTestPlanInput, SavedTestPlan } from "@/contracts/plans";
import { createTestPlanService } from "@/server/plans/service";

export async function createTestPlan(input: CreateTestPlanInput): Promise<ActionResult<SavedTestPlan>> {
  return createTestPlanService(input);
}
