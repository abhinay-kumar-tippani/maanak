import "server-only";
import { z } from "zod";
import { isDeepStrictEqual } from "node:util";
import type { SavedTestPlan } from "@/contracts/plans";
import { generateTestPlan } from "@/domain/oiml/plans/generate";

export const planRequestSchema = z.object({ evaluationId: z.uuid(), expectedRowVersion: z.number().int().nonnegative().safe() }).strict();
export const rowVersionSchema = z.union([z.string().regex(/^\d+$/), z.number().int().nonnegative()])
  .transform(value => Number(value)).pipe(z.number().int().nonnegative().safe());

export function parseSavedPlan(input: unknown): SavedTestPlan {
  const row = z.object({ id: z.uuid(), evaluationId: z.uuid(), versionNo: z.number().int().positive().safe(),
    createdAt: z.string().min(1), createdBy: z.uuid(), plan: z.record(z.string(), z.unknown()),
  }).parse(input);
  // v1 reads are fail-closed on unknown/corrupt snapshots. Do not reinterpret later rule versions.
  const result = generateTestPlan({ id: row.plan.specificationRevisionId, versionNo: row.plan.specificationVersion, specifications: row.plan.specifications });
  if (!result.ok || !isDeepStrictEqual(row.plan, JSON.parse(JSON.stringify(result.plan)))) throw new Error("INVALID_PLAN_SNAPSHOT");
  return { ...row, plan: result.plan };
}
