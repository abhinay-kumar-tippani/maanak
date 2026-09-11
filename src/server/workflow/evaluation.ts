import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import type { ActionResult, EvaluationEnvelope, Observations, TestCode } from "@/contracts/domain";
import type { CompletionResult, EvaluateResult, EvaluationWorkspace, ReadyResult, RetestResult, SaveObservationsInput, SaveObservationsResult, TestSessionDto } from "@/contracts/testing";
import type { PlanConfiguration } from "@/contracts/plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActor, requireAssignedTester } from "@/server/auth/authorize";
import { invokeCommand } from "@/server/db/commands";
import { normalizeSpecification } from "@/domain/oiml/schemas/specifications";
import { observationSchemas, selectedDefinitions } from "@/domain/oiml/definitions/selected";
import { evaluateSelectedTest, ENGINE_VERSION } from "@/domain/oiml/evaluators/selected";

const uuid = z.uuid();
const integer = z.number().int().nonnegative();
const decimal=z.string().regex(/^-?\d+(?:\.\d+)?$/);const conditionSchema = z.object({ startTemperatureC:decimal.nullable(),endTemperatureC:decimal.nullable(),startedAt:z.iso.datetime(),endedAt:z.iso.datetime(),temperatureStabilityConfirmed:z.boolean() }).strict();
const equipmentSchema = z.array(z.object({ name:z.string().min(1),type:z.string().min(1),referenceNumber:z.string().min(1),suitabilityConfirmed:z.boolean(),note:z.string().optional() }).strict());

function fail<T>(code:string,message:string): ActionResult<T> { return { ok:false,error:{code,message} }; }
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
const digest = (value:unknown) => createHash("sha256").update(canonical(value)).digest("hex");

async function client() { const value=await createSupabaseServerClient(); if(!value) throw new Error("CONFIGURATION_ERROR"); return value; }
async function verifiedTester(evaluationId:string){const db=await client();const{data,error}=await db.auth.getUser();if(error||!data.user)throw new Error("AUTH_REQUIRED");const actor=await requireActor();if(actor.id!==data.user.id)throw new Error("AUTH_CHANGED");return requireAssignedTester(actor,evaluationId);}

export async function getEvaluationWorkspace(evaluationId:string): Promise<ActionResult<EvaluationWorkspace>> {
  if(!uuid.safeParse(evaluationId).success) return fail("VALIDATION_ERROR","A valid evaluation ID is required.");
  try {
    await requireActor(); const db=await client();
    const {data:e,error}=await db.from("evaluations").select("id,instrument_id,application_number,state,row_version::text,current_plan_id,current_specification_id").eq("id",evaluationId).single();
    if(error||!e||!e.current_plan_id||!e.current_specification_id) return fail("PLAN_REQUIRED","A saved current plan and specification are required.");
    const {data:items,error:itemError}=await db.from("test_plan_items").select("id,definition_id,configuration,position").eq("plan_id",e.current_plan_id).eq("coverage","REQUIRED").order("position");
    if(itemError) throw itemError;
    const ids=(items??[]).map(i=>i.id);
    const defIds=(items??[]).map(i=>i.definition_id);
    const [{data:defs,error:defError},{data:sessions,error:sessionError}]=await Promise.all([
      db.from("test_definitions").select("id,code,name").in("id",defIds),
      ids.length?db.from("test_sessions").select("id,evaluation_id,plan_item_id,attempt_no,state,row_version::text,conditions,equipment_snapshot,procedure_confirmations,remarks,retest_reason,completed_at").in("plan_item_id",ids).order("attempt_no",{ascending:false}):Promise.resolve({data:[],error:null}),
    ]);
    if(defError||sessionError) throw defError??sessionError;
    const current=(sessions??[]).filter((s,index,all)=>all.findIndex(x=>x.plan_item_id===s.plan_item_id)===index);
    const sessionIds=current.map(s=>s.id);
    const [{data:obs,error:obsError},{data:results,error:resultError}]=await Promise.all([
      sessionIds.length?db.from("test_observations").select("session_id,payload").in("session_id",sessionIds).eq("row_key","observations"):Promise.resolve({data:[],error:null}),
      sessionIds.length?db.from("test_results").select("session_id,session_version,outcome,evaluation_json,evaluated_at").in("session_id",sessionIds).order("evaluated_at",{ascending:false}):Promise.resolve({data:[],error:null}),
    ]);
    if(obsError||resultError) throw obsError??resultError;
    const dto=(s:Record<string,unknown>,code:TestCode):TestSessionDto=>{
      const currentResult=(results??[]).find(r=>r.session_id===s.id && Number(r.session_version)===(s.state==="COMPLETED"?Number(s.row_version)-1:Number(s.row_version)));
      return {id:String(s.id),evaluationId:String(s.evaluation_id),planItemId:String(s.plan_item_id),testCode:code,attemptNo:Number(s.attempt_no),state:s.state as "DRAFT"|"COMPLETED",rowVersion:Number(s.row_version),
        observations:((obs??[]).find(o=>o.session_id===s.id)?.payload??null) as Observations|null,conditions:(s.conditions??{}) as TestSessionDto["conditions"],equipment:(s.equipment_snapshot??[]) as TestSessionDto["equipment"],
        procedureConfirmations:(s.procedure_confirmations??{}) as Record<string,boolean>,remarks:typeof s.remarks==="string"?s.remarks:null,retestReason:typeof s.retest_reason==="string"?s.retest_reason:null,
        result:(currentResult?.evaluation_json??null) as EvaluationEnvelope|null,resultOutcome:(currentResult?.outcome??null) as TestSessionDto["resultOutcome"],completedAt:typeof s.completed_at==="string"?s.completed_at:null};
    };
    const definitionMap=new Map((defs??[]).map(d=>[d.id,d]));
    return {ok:true,version:Number(e.row_version),data:{evaluationId:e.id,instrumentId:e.instrument_id,applicationNumber:e.application_number,state:e.state,rowVersion:Number(e.row_version),planId:e.current_plan_id,specificationId:e.current_specification_id,
      items:(items??[]).map(item=>{const d=definitionMap.get(item.definition_id)!;const s=current.find(row=>row.plan_item_id===item.id);return{id:item.id,code:d.code as TestCode,name:d.name,configuration:item.configuration,session:s?dto(s as unknown as Record<string,unknown>,d.code as TestCode):null};})}};
  } catch { return fail("WORKSPACE_FAILED","The authorized test workspace could not be loaded."); }
}

export async function saveObservationsService(input:SaveObservationsInput):Promise<ActionResult<SaveObservationsResult>> {
  const schema=z.object({evaluationId:uuid,planItemId:uuid,sessionId:uuid.optional(),expectedEvaluationVersion:integer,expectedSessionVersion:integer,observations:z.unknown(),conditions:conditionSchema,equipment:equipmentSchema.min(1),procedureConfirmations:z.record(z.string(),z.boolean()),remarks:z.string().max(2000).optional()}).strict();
  const parsed=schema.safeParse(input); if(!parsed.success)return fail("VALIDATION_ERROR",parsed.error.issues[0]?.message??"Observation input is invalid.");
  const observationSchema=observationSchemas[(parsed.data.observations as Observations)?.type as TestCode];
  if(!observationSchema||!observationSchema.safeParse(parsed.data.observations).success)return fail("VALIDATION_ERROR","Observation rows do not match the selected test schema.");
  try { const actor=await verifiedTester(parsed.data.evaluationId); return invokeCommand(actor,"command_save_observations",{
    p_evaluation_id:parsed.data.evaluationId,p_plan_item_id:parsed.data.planItemId,p_session_id:parsed.data.sessionId??null,p_expected_evaluation_version:parsed.data.expectedEvaluationVersion,
    p_expected_session_version:parsed.data.expectedSessionVersion,p_observations:parsed.data.observations,p_conditions:parsed.data.conditions,p_equipment:parsed.data.equipment,p_procedure_confirmations:parsed.data.procedureConfirmations,p_remarks:parsed.data.remarks??null});
  } catch { return fail("PERMISSION_DENIED","Only the active assigned tester may save observations."); }
}

async function loadEvaluationInput(evaluationId:string,sessionId:string){
  const db=await client();
  const {data:e,error}=await db.from("evaluations").select("id,row_version::text,current_plan_id,current_specification_id").eq("id",evaluationId).single();if(error||!e)throw new Error("PERMISSION_DENIED");
  const {data:s,error:se}=await db.from("test_sessions").select("id,row_version::text,plan_item_id,conditions,equipment_snapshot,procedure_confirmations,state").eq("id",sessionId).eq("evaluation_id",evaluationId).single();if(se||!s)throw new Error("SESSION_REQUIRED");
  const [{data:i,error:ie},{data:p,error:pe},{data:spec,error:spe},{data:o,error:oe}]=await Promise.all([
    db.from("test_plan_items").select("id,definition_id,configuration").eq("id",s.plan_item_id).eq("plan_id",e.current_plan_id).single(),
    db.from("test_plans").select("id,rule_set_id").eq("id",e.current_plan_id).eq("specification_id",e.current_specification_id).single(),
    db.from("specification_revisions").select("id,version_no,accuracy_class,max_g::text,min_g::text,e_g::text,d_g::text,features").eq("id",e.current_specification_id).single(),
    db.from("test_observations").select("payload").eq("session_id",s.id).eq("row_key","observations").single(),
  ]);if(ie||pe||spe||oe||!i||!p||!spec||!o)throw new Error("INPUT_INCOMPLETE");
  const normalized=normalizeSpecification(spec); const definition=selectedDefinitions.find(d=>d.id===i.definition_id);if(!definition)throw new Error("DEFINITION_MISSING");
  const snapshot={specification:{id:spec.id,version_no:spec.version_no,accuracy_class:spec.accuracy_class,max_g:spec.max_g,min_g:spec.min_g,e_g:spec.e_g,d_g:spec.d_g,features:spec.features},configuration:i.configuration,observations:o.payload,conditions:s.conditions,equipment:s.equipment_snapshot,procedureConfirmations:s.procedure_confirmations,sessionVersion:Number(s.row_version),planId:p.id,ruleSetId:p.rule_set_id};
  return {e,s,i,p,normalized,definition,snapshot};
}

export async function evaluateTestService(input:{evaluationId:string;sessionId:string;expectedEvaluationVersion:number;expectedSessionVersion:number}):Promise<ActionResult<EvaluateResult>>{
  const parsed=z.object({evaluationId:uuid,sessionId:uuid,expectedEvaluationVersion:integer,expectedSessionVersion:integer}).safeParse(input);if(!parsed.success)return fail("VALIDATION_ERROR","Valid evaluation, session and version values are required.");
  try { const actor=await verifiedTester(parsed.data.evaluationId);const loaded=await loadEvaluationInput(parsed.data.evaluationId,parsed.data.sessionId);
    if(Number(loaded.e.row_version)!==parsed.data.expectedEvaluationVersion||Number(loaded.s.row_version)!==parsed.data.expectedSessionVersion||loaded.s.state!=="DRAFT")return fail("STALE_DATA","Reload before calculating this test.");
    const inputSha256=digest(loaded.snapshot);const evaluation=evaluateSelectedTest({evaluationId:loaded.e.id,sessionId:loaded.s.id,sessionVersion:Number(loaded.s.row_version),specificationRevisionId:loaded.normalized.id,
      specifications:loaded.normalized.specifications,configuration:loaded.i.configuration as PlanConfiguration,observations:loaded.snapshot.observations as Observations,conditions:loaded.snapshot.conditions as TestSessionDto["conditions"],equipment:loaded.snapshot.equipment as TestSessionDto["equipment"],
      procedureConfirmations:loaded.snapshot.procedureConfirmations as Record<string,boolean>,requiredConfirmations:loaded.definition.procedureConfirmations,inputSha256,evaluatedAt:new Date().toISOString()});
    if(evaluation.outcome==="NOT_SUPPORTED"||evaluation.outcome==="NOT_VERIFIED")return fail(evaluation.outcome,evaluation.issues.map(i=>i.message).join(" ")||"The selected evaluator cannot determine this case.");
    return invokeCommand(actor,"command_record_result",{p_evaluation_id:parsed.data.evaluationId,p_session_id:parsed.data.sessionId,p_expected_evaluation_version:parsed.data.expectedEvaluationVersion,p_expected_session_version:parsed.data.expectedSessionVersion,
      p_input_snapshot:loaded.snapshot,p_input_sha256:inputSha256,p_engine_version:ENGINE_VERSION,p_outcome:evaluation.outcome,p_evaluation:evaluation});
  }catch{return fail("EVALUATION_FAILED","The saved input could not be evaluated.");}
}

export async function completeTestService(input:{evaluationId:string;sessionId:string;expectedEvaluationVersion:number;expectedSessionVersion:number}):Promise<ActionResult<CompletionResult>>{
  try{const actor=await verifiedTester(input.evaluationId);return invokeCommand(actor,"command_complete_test",{p_evaluation_id:input.evaluationId,p_session_id:input.sessionId,p_expected_evaluation_version:input.expectedEvaluationVersion,p_expected_session_version:input.expectedSessionVersion});}
  catch{return fail("PERMISSION_DENIED","Only the assigned tester may complete this test.");}
}
export async function startRetestService(input:{evaluationId:string;planItemId:string;expectedEvaluationVersion:number;reason:string}):Promise<ActionResult<RetestResult>>{
  try{const actor=await verifiedTester(input.evaluationId);return invokeCommand(actor,"command_start_retest",{p_evaluation_id:input.evaluationId,p_plan_item_id:input.planItemId,p_expected_evaluation_version:input.expectedEvaluationVersion,p_reason:input.reason});}
  catch{return fail("PERMISSION_DENIED","Only the assigned tester may start a retest.");}
}
export async function markReadyService(input:{evaluationId:string;expectedEvaluationVersion:number}):Promise<ActionResult<ReadyResult>>{
  try{const actor=await verifiedTester(input.evaluationId);return invokeCommand(actor,"command_mark_ready",{p_evaluation_id:input.evaluationId,p_expected_evaluation_version:input.expectedEvaluationVersion});}
  catch{return fail("PERMISSION_DENIED","Only the assigned tester may mark selected tests ready.");}
}
