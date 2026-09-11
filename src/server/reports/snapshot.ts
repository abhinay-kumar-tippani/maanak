import "server-only";
import type { ReportSnapshot } from "@/contracts/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeSpecification } from "@/domain/oiml/schemas/specifications";

export async function buildSubmissionSnapshot(evaluationId:string):Promise<ReportSnapshot>{
  const db=await createSupabaseServerClient();if(!db)throw new Error("CONFIGURATION_ERROR");
  const {data:e,error}=await db.from("evaluations").select("id,instrument_id,application_number,current_specification_id,current_plan_id,state").eq("id",evaluationId).single();if(error||!e)throw new Error("EVALUATION_UNAVAILABLE");
  const [{data:instrument},{data:spec},{data:plan},{data:lab}]=await Promise.all([
    db.from("instruments").select("id,model_id,applicant_id,sample_identifier,serial_number,laboratory_id").eq("id",e.instrument_id).single(),
    db.from("specification_revisions").select("id,version_no,accuracy_class,max_g::text,min_g::text,e_g::text,d_g::text,features").eq("id",e.current_specification_id).single(),
    db.from("test_plans").select("id,plan_snapshot").eq("id",e.current_plan_id).single(),
    db.from("laboratories").select("name,address").single(),
  ]);if(!instrument||!spec||!plan||!lab)throw new Error("SNAPSHOT_INPUT_MISSING");
  const [{data:model},{data:applicant}]=await Promise.all([db.from("instrument_models").select("manufacturer_id,designation").eq("id",instrument.model_id).single(),db.from("parties").select("name,address").eq("id",instrument.applicant_id).single()]);
  if(!model||!applicant)throw new Error("PARTY_INPUT_MISSING");const {data:manufacturer}=await db.from("parties").select("name,address").eq("id",model.manufacturer_id).single();if(!manufacturer)throw new Error("MANUFACTURER_INPUT_MISSING");
  const {data:items}=await db.from("test_plan_items").select("id,position").eq("plan_id",plan.id).eq("coverage","REQUIRED").order("position");const itemIds=(items??[]).map(i=>i.id);
  const {data:sessions}=await db.from("test_sessions").select("id,plan_item_id,attempt_no,row_version::text,conditions,equipment_snapshot,state").in("plan_item_id",itemIds).eq("state","COMPLETED").order("attempt_no",{ascending:false});
  const current=(sessions??[]).filter((s,index,all)=>all.findIndex(x=>x.plan_item_id===s.plan_item_id)===index);const sessionIds=current.map(s=>s.id);
  const [{data:observations},{data:results},{data:attachments}]=await Promise.all([
    db.from("test_observations").select("session_id,payload").in("session_id",sessionIds).eq("row_key","observations"),
    db.from("test_results").select("session_id,session_version,evaluation_json,evaluated_at").in("session_id",sessionIds).order("evaluated_at",{ascending:false}),
    db.from("attachments").select("id,sha256,original_name").eq("evaluation_id",e.id).in("session_id",sessionIds).eq("state","READY"),
  ]);
  const orderedCurrent=itemIds.map(itemId=>current.find(s=>s.plan_item_id===itemId)).filter((s):s is NonNullable<typeof s>=>Boolean(s));
  const testData=orderedCurrent.map(s=>{const result=(results??[]).find(r=>r.session_id===s.id&&Number(r.session_version)===Number(s.row_version)-1);const observation=(observations??[]).find(o=>o.session_id===s.id);if(!result||!observation)throw new Error("CURRENT_RESULT_MISSING");return{observations:observation.payload,evaluation:result.evaluation_json};});
  if(testData.length!==3)throw new Error("SELECTED_TESTS_INCOMPLETE");const normalized=normalizeSpecification(spec);
  const planSnapshot=plan.plan_snapshot as {coverage:ReportSnapshot["coverage"]};
  const coverage=planSnapshot.coverage.map(entry=>entry.status==="REQUIRED"?{...entry,explanation:"This selected baseline procedure was evaluated for the frozen current attempt. This remains partial coverage of the form and is not full conformity."}:entry);
  return{schemaVersion:"1",evaluationId:e.id,reportId:"00000000-0000-0000-0000-000000000000",reportNumber:"PENDING",versionNo:0,kind:"SUBMITTED",generatedAt:new Date().toISOString(),applicationNumber:e.application_number,
    laboratory:{name:lab.name,address:lab.address},applicant,manufacturer,instrument:{designation:model.designation,sampleIdentifier:instrument.sample_identifier,serialNumber:instrument.serial_number},specifications:normalized.specifications,
    manualIntake:((spec.features as Record<string,unknown>).manualIntake??{}) as Record<string,unknown>,testData:testData as ReportSnapshot["testData"],coverage,testEquipment:current.flatMap(s=>Array.isArray(s.equipment_snapshot)?s.equipment_snapshot:[]),conditions:current.map(s=>s.conditions as Record<string,unknown>),
    evidence:(attachments??[]).map(a=>({attachmentId:a.id,sha256:a.sha256??"NOT_RECORDED",description:a.original_name})),scopeStatement:"Demonstration only - selected tests; full type conformity not determined.",overallConformity:"NOT_DETERMINED",approval:null};
}
