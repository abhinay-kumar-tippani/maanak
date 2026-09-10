import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LabRole = "TESTER" | "APPROVER" | "ADMIN";
export type Actor = {
  id: string;
  laboratoryId: string;
  displayName: string;
  role: LabRole;
};

export class AuthorizationError extends Error {
  constructor(public readonly code: "AUTH_REQUIRED" | "PROFILE_REQUIRED" | "ROLE_REQUIRED" | "LABORATORY_SCOPE_REQUIRED" | "ASSIGNMENT_REQUIRED" | "CONFIGURATION_ERROR", message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireActor(): Promise<Actor> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new AuthorizationError("CONFIGURATION_ERROR", "Authentication is not configured.");

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const id = claimsData?.claims?.sub;
  if (claimsError || typeof id !== "string") {
    throw new AuthorizationError("AUTH_REQUIRED", "Authentication is required.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("laboratory_id, display_name, role, active")
    .eq("id", id)
    .maybeSingle();

  if (error || !data?.active) {
    throw new AuthorizationError("PROFILE_REQUIRED", "No active laboratory profile is configured for this account.");
  }
  if (data.role !== "TESTER" && data.role !== "APPROVER" && data.role !== "ADMIN") {
    throw new AuthorizationError("PROFILE_REQUIRED", "The laboratory profile has an invalid role.");
  }

  return { id, laboratoryId: data.laboratory_id, displayName: data.display_name, role: data.role };
}

export function requireRole(actor: Actor, ...roles: LabRole[]): Actor {
  if (!roles.includes(actor.role)) {
    throw new AuthorizationError("ROLE_REQUIRED", "This operation is not permitted for the current laboratory role.");
  }
  return actor;
}

export function requireLaboratory(actor: Actor, laboratoryId: string): Actor {
  if (actor.laboratoryId !== laboratoryId) {
    throw new AuthorizationError("LABORATORY_SCOPE_REQUIRED", "The requested record is outside your laboratory.");
  }
  return actor;
}

export async function requireAssignedTester(actor: Actor, evaluationId: string): Promise<Actor> {
  requireRole(actor, "TESTER");
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new AuthorizationError("CONFIGURATION_ERROR", "Authentication is not configured.");
  const { data, error } = await supabase
    .from("evaluations")
    .select("laboratory_id, assigned_tester_id")
    .eq("id", evaluationId)
    .maybeSingle();
  if (error || !data || data.laboratory_id !== actor.laboratoryId || data.assigned_tester_id !== actor.id) {
    throw new AuthorizationError("ASSIGNMENT_REQUIRED", "You are not assigned to this evaluation.");
  }
  return actor;
}
