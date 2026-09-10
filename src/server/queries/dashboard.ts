import "server-only";

import type { DashboardData, DashboardAuditEvent } from "@/contracts/dashboard";
import { requireActor } from "@/server/auth/authorize";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function countEvaluationsByState(states: string[]) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Authentication is not configured.");
  const { count, error } = await supabase
    .from("evaluations")
    .select("id", { count: "exact", head: true })
    .in("state", states);
  if (error) throw error;
  return count ?? 0;
}

async function countCurrentFailedResults() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Authentication is not configured.");

  const { data: evaluations, error: evaluationsError } = await supabase
    .from("evaluations")
    .select("id, current_plan_id");
  if (evaluationsError) throw evaluationsError;
  const currentPlans = (evaluations ?? []).filter((row) => typeof row.current_plan_id === "string");
  if (currentPlans.length === 0) return 0;

  const planIds = currentPlans.map((row) => row.current_plan_id as string);
  const { data: items, error: itemsError } = await supabase
    .from("test_plan_items")
    .select("id, evaluation_id, plan_id")
    .in("plan_id", planIds);
  if (itemsError) throw itemsError;
  if (!items || items.length === 0) return 0;

  const itemIds = items.map((item) => item.id);
  const { data: sessions, error: sessionsError } = await supabase
    .from("test_sessions")
    .select("id, evaluation_id, plan_item_id, attempt_no")
    .in("plan_item_id", itemIds);
  if (sessionsError) throw sessionsError;

  const latestAttemptByItem = new Map<string, { id: string; attemptNo: number }>();
  for (const session of sessions ?? []) {
    const previous = latestAttemptByItem.get(session.plan_item_id);
    if (!previous || session.attempt_no > previous.attemptNo) {
      latestAttemptByItem.set(session.plan_item_id, { id: session.id, attemptNo: session.attempt_no });
    }
  }
  const currentSessionIds = [...latestAttemptByItem.values()].map((session) => session.id);
  if (currentSessionIds.length === 0) return 0;

  const { data: results, error: resultsError } = await supabase
    .from("test_results")
    .select("session_id, session_version, outcome")
    .in("session_id", currentSessionIds);
  if (resultsError) throw resultsError;

  const latestResultBySession = new Map<string, { version: number; outcome: string }>();
  for (const result of results ?? []) {
    const previous = latestResultBySession.get(result.session_id);
    if (!previous || Number(result.session_version) > previous.version) {
      latestResultBySession.set(result.session_id, { version: Number(result.session_version), outcome: result.outcome });
    }
  }
  return [...latestResultBySession.values()].filter((result) => result.outcome === "FAIL").length;
}

async function getRecentAuditEvents(): Promise<DashboardAuditEvent[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Authentication is not configured.");
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, evaluation_id, actor_id, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []).map((event) => ({
    id: Number(event.id),
    action: event.action,
    entityType: event.entity_type,
    entityId: event.entity_id,
    evaluationId: event.evaluation_id,
    actorId: event.actor_id,
    createdAt: event.created_at,
  }));
}

export async function getDashboard(): Promise<DashboardData> {
  await requireActor();
  const [evaluationsInProgress, evaluationsAwaitingReview, approvedEvaluations, issuedReports, failedCurrentTestResults, recentAuditEvents] = await Promise.all([
    countEvaluationsByState(["DRAFT", "PLANNED", "TESTING", "CORRECTION_REQUESTED"]),
    countEvaluationsByState(["UNDER_REVIEW"]),
    countEvaluationsByState(["APPROVED"]),
    countEvaluationsByState(["ISSUED"]),
    countCurrentFailedResults(),
    getRecentAuditEvents(),
  ]);

  return {
    metrics: { evaluationsInProgress, evaluationsAwaitingReview, approvedEvaluations, issuedReports, failedCurrentTestResults },
    recentAuditEvents,
    activityState: recentAuditEvents.length === 0 ? "EMPTY" : "AVAILABLE",
  };
}
