import "server-only";

import type { SpecificationRevision } from "@/contracts/specifications";
import { requireActor } from "@/server/auth/authorize";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getClient() {
  await requireActor();
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Authentication is not configured.");
  return supabase;
}

function mapRevision(row: Record<string, unknown>): SpecificationRevision {
  const features = (row.features && typeof row.features === "object" ? row.features : {}) as Record<string, unknown>;
  const manualIntake = (features.manualIntake && typeof features.manualIntake === "object" ? features.manualIntake : {}) as Record<string, unknown>;
  const status = (value: unknown): "CONFIRMED" | "NOT_CONFIRMED" | "NOT_VERIFIED" => value === "CONFIRMED" || value === "NOT_CONFIRMED" ? value : "NOT_VERIFIED";
  return {
    accuracyClass: row.accuracy_class as SpecificationRevision["accuracyClass"], maxG: String(row.max_g), minG: String(row.min_g), eG: String(row.e_g), dG: String(row.d_g),
    rangeType: features.rangeType as SpecificationRevision["rangeType"], category: features.category as SpecificationRevision["category"], indication: features.indication as SpecificationRevision["indication"],
    auxiliaryIndication: Boolean(features.auxiliaryIndication), extendedIndicationUsed: Boolean(features.extendedIndicationUsed), isGradingInstrument: Boolean(features.isGradingInstrument), receptor: features.receptor as SpecificationRevision["receptor"], supportPoints: Number(features.supportPoints),
    maximumAdditiveTareG: String(features.maximumAdditiveTareG ?? "0"), initialZeroSettingRangePercent: String(features.initialZeroSettingRangePercent ?? "0"), automaticZeroSettingExists: Boolean(features.automaticZeroSettingExists), zeroTrackingExists: Boolean(features.zeroTrackingExists),
    declaredTemperatureMinC: String(features.declaredTemperatureMinC ?? "0"), declaredTemperatureMaxC: String(features.declaredTemperatureMaxC ?? "0"),
    manualIntake: { documentReview: status(manualIntake.documentReview), markings: status(manualIntake.markings), sealing: status(manualIntake.sealing), environment: status(manualIntake.environment), notes: typeof manualIntake.notes === "string" ? manualIntake.notes : null },
    id: String(row.id), evaluationId: String(row.evaluation_id), versionNo: Number(row.version_no), recordedBy: String(row.recorded_by), createdAt: String(row.created_at), resultingEvaluationState: "DRAFT", resultingRowVersion: Number(row.resulting_row_version ?? 0),
  };
}

export async function getCurrentSpecification(evaluationId: string): Promise<SpecificationRevision | null> {
  const supabase = await getClient();
  const { data, error } = await supabase.from("evaluations").select("current_specification_id,row_version").eq("id", evaluationId).maybeSingle();
  if (error) throw error;
  if (!data?.current_specification_id) return null;
  const { data: revision, error: revisionError } = await supabase.from("specification_revisions").select("id, evaluation_id, version_no, accuracy_class, max_g, min_g, e_g, d_g, features, recorded_by, created_at").eq("id", data.current_specification_id).maybeSingle();
  if (revisionError) throw revisionError;
  if (!revision) return null;
  const mapped = mapRevision(revision as Record<string, unknown>);
  mapped.resultingRowVersion = Number(data.row_version ?? 0);
  return mapped;
}

export async function listSpecificationRevisions(evaluationId: string): Promise<SpecificationRevision[]> {
  const supabase = await getClient();
  const { data, error } = await supabase.from("specification_revisions").select("id, evaluation_id, version_no, accuracy_class, max_g, min_g, e_g, d_g, features, recorded_by, created_at").eq("evaluation_id", evaluationId).order("version_no", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapRevision(row as Record<string, unknown>));
}
