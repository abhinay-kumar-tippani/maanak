import "server-only";

import type { ActionResult } from "@/contracts/domain";
import type { RegistrationResult } from "@/contracts/instruments";
import type { SpecificationRevision } from "@/contracts/specifications";
import { createClient } from "@supabase/supabase-js";
import { AuthorizationError, requireActor, requireRole, type Actor } from "@/server/auth/authorize";
import { instrumentRegistrationSchema } from "@/server/instruments/validation";
import { saveSpecificationInputSchema } from "@/server/specifications/validation";

function createPrivilegedSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("Privileged Supabase configuration is unavailable.");
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export type CommandName =
  | "command_register_instrument"
  | "command_save_specification"
  | "command_create_plan"
  | "command_save_observations"
  | "command_record_result"
  | "command_complete_test"
  | "command_mark_ready"
  | "command_submit"
  | "command_review"
  | "command_start_retest"
  | "command_prepare_final"
  | "command_finish_artifact"
  | "command_fail_artifact"
  | "command_reserve_attachment"
  | "command_finish_attachment"
  | "command_archive";

function logSafeRegistrationDatabaseError(error: unknown) {
  const candidate = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const sanitize = (value: unknown) => {
    if (typeof value !== "string") return null;
    return value
      .replace(/(?:password|secret|api[_-]?key|token|cookie|authorization)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
      .replace(/[\r\n]+/g, " ")
      .slice(0, 1000);
  };
  console.error("[registration] database command failed", {
    code: sanitize(candidate.code),
    message: sanitize(candidate.message),
    hint: sanitize(candidate.hint),
    details: sanitize(candidate.details),
  });
}

export function mapCommandError(error: unknown): Extract<ActionResult<never>, { ok: false }> {
  const message = error instanceof Error ? error.message : "The command could not be completed.";
  const normalized = message.toUpperCase();
  const code = normalized.includes("DUPLICATE_SAMPLE") ? "DUPLICATE_SAMPLE"
    : normalized.includes("VALIDATION") ? "VALIDATION_ERROR"
      : normalized.includes("STALE") ? "STALE_DATA"
        : normalized.includes("PERMISSION") || normalized.includes("ROLE") || normalized.includes("AUTH") || normalized.includes("ASSIGNMENT") || normalized.includes("CROSS_LABORATORY") ? "PERMISSION_DENIED"
          : normalized.includes("LOCKED") || normalized.includes("STATE") || normalized.includes("FINALIZED") ? "INVALID_STATE"
            : "REGISTRATION_FAILED";
  const messages: Record<string, string> = {
    DUPLICATE_SAMPLE: "That sample identifier is already registered in this laboratory.",
    VALIDATION_ERROR: "The registration details are invalid.",
    PERMISSION_DENIED: "You are not permitted to register an instrument.",
    STALE_DATA: "The record changed before this operation completed.",
    INVALID_STATE: "The operation is not valid for the current record state.",
    REGISTRATION_FAILED: "The instrument registration could not be completed.",
  };
  return { ok: false, error: { code, message: messages[code] } };
}

/**
 * Calls only named command RPCs. Each concrete RPC must validate the supplied
 * verified actor, expected version, laboratory/assignment, and set app.actor_id
 * with SET LOCAL before doing its transaction work. There is intentionally no
 * generic table or SQL dispatcher and no success fallback when an RPC is absent.
 */
export async function invokeCommand<T>(actor: Actor, name: CommandName, args: Record<string, unknown>): Promise<ActionResult<T>> {
  try {
    const supabase = createPrivilegedSupabaseClient();
    const { data, error } = await supabase.rpc(name, {
      ...args,
      p_actor_id: actor.id,
    });
    if (error) {
      if (name === "command_register_instrument") logSafeRegistrationDatabaseError(error);
      return mapCommandError(error);
    }
    if (!data || typeof data !== "object") return { ok: false, error: { code: "COMMAND_FAILED", message: "The command returned no valid result." } };
    // PostgREST returns a one-row table RPC as an array. Normalize that shape
    // before exposing the typed command result to server actions.
    const payload = Array.isArray(data) ? data[0] : data;
    if (!payload || typeof payload !== "object") return { ok: false, error: { code: "COMMAND_FAILED", message: "The command returned no valid result." } };
    return { ok: true, data: payload as T, version: typeof (payload as { version?: unknown }).version === "number" ? (payload as { version: number }).version : 0 };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, error: { code: error.code, message: error.message } };
    if (name === "command_register_instrument") logSafeRegistrationDatabaseError(error);
    return mapCommandError(error);
  }
}

export async function registerInstrumentCommand(input: unknown): Promise<ActionResult<RegistrationResult>> {
  const parsed = instrumentRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".") || "form"] = issue.message;
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "The registration details are invalid.", fieldErrors } };
  }
  try {
    const actor = requireRole(await requireActor(), "TESTER");
    return await invokeCommand<RegistrationResult>(actor, "command_register_instrument", {
      p_manufacturer_name: parsed.data.manufacturerName,
      p_manufacturer_address: parsed.data.manufacturerAddress,
      p_applicant_name: parsed.data.applicantName,
      p_applicant_address: parsed.data.applicantAddress,
      p_designation: parsed.data.designation,
      p_category: parsed.data.category,
      p_description: parsed.data.description,
      p_sample_identifier: parsed.data.sampleIdentifier,
      p_serial_number: parsed.data.serialNumber,
      p_assigned_tester_id: parsed.data.assignedTesterId,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, error: { code: "PERMISSION_DENIED", message: error.message } };
    }
    return mapCommandError(error);
  }
}

export async function saveSpecificationCommand(input: unknown): Promise<ActionResult<SpecificationRevision>> {
  const parsed = saveSpecificationInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".") || "form"] = issue.message;
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "The specification details are invalid.", fieldErrors } };
  }
  const { evaluationId, expectedRowVersion, ...specificationValues } = parsed.data;
  try {
    const actor = requireRole(await requireActor(), "TESTER");
    const result = await invokeCommand<SpecificationRevision>(actor, "command_save_specification", {
      p_evaluation_id: evaluationId,
      p_expected_row_version: expectedRowVersion,
      p_accuracy_class: parsed.data.accuracyClass,
      p_max_g: parsed.data.maxG,
      p_min_g: parsed.data.minG,
      p_e_g: parsed.data.eG,
      p_d_g: parsed.data.dG,
      p_features: {
        rangeType: specificationValues.rangeType, category: specificationValues.category, indication: specificationValues.indication,
        auxiliaryIndication: specificationValues.auxiliaryIndication, extendedIndicationUsed: specificationValues.extendedIndicationUsed, isGradingInstrument: specificationValues.isGradingInstrument,
        receptor: specificationValues.receptor, supportPoints: specificationValues.supportPoints, maximumAdditiveTareG: specificationValues.maximumAdditiveTareG,
        initialZeroSettingRangePercent: specificationValues.initialZeroSettingRangePercent, automaticZeroSettingExists: specificationValues.automaticZeroSettingExists, zeroTrackingExists: specificationValues.zeroTrackingExists,
        declaredTemperatureMinC: specificationValues.declaredTemperatureMinC, declaredTemperatureMaxC: specificationValues.declaredTemperatureMaxC, manualIntake: specificationValues.manualIntake,
      },
    });
    if (!result.ok && result.error.code === "INVALID_STATE") {
      return { ok: false, error: { code: "SPECIFICATION_LOCKED", message: "This evaluation cannot be edited in its current state." } };
    }
    if (!result.ok && result.error.code === "REGISTRATION_FAILED") {
      return { ok: false, error: { code: "SPECIFICATION_FAILED", message: "The specification revision could not be saved." } };
    }
    return result;
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, error: { code: "PERMISSION_DENIED", message: error.message } };
    return mapCommandError(error);
  }
}
