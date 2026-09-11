-- Selected-demo observation, review, evidence and report commands.
-- All browser roles remain read-only; mutation is through these named server commands.
begin;

create function private.require_active_actor(p_actor_id uuid, p_evaluation_id uuid, p_role public.lab_role)
returns public.evaluations language plpgsql security definer set search_path = '' as $$
declare v_evaluation public.evaluations; v_profile public.profiles;
begin
  select e.* into v_evaluation from public.evaluations e where e.id=p_evaluation_id for update;
  if not found then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
  select p.* into v_profile from public.profiles p where p.id=p_actor_id and p.active and p.laboratory_id=v_evaluation.laboratory_id;
  if not found or v_profile.role is distinct from p_role then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
  if p_role='TESTER' and v_evaluation.assigned_tester_id is distinct from p_actor_id then raise exception using errcode='42501',message='ASSIGNMENT_REQUIRED'; end if;
  if p_role='APPROVER' and v_evaluation.assigned_tester_id=p_actor_id then raise exception using errcode='42501',message='INDEPENDENT_REVIEW_REQUIRED'; end if;
  return v_evaluation;
end $$;
revoke all on function private.require_active_actor(uuid,uuid,public.lab_role) from public,anon,authenticated;

create or replace function public.command_save_observations(
  p_actor_id uuid,p_evaluation_id uuid,p_plan_item_id uuid,p_session_id uuid,
  p_expected_evaluation_version bigint,p_expected_session_version bigint,
  p_observations jsonb,p_conditions jsonb,p_equipment jsonb,p_procedure_confirmations jsonb,p_remarks text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_item public.test_plan_items; v_s public.test_sessions; v_session_id uuid; v_attempt integer; v_code text;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  if v_e.row_version<>p_expected_evaluation_version then raise exception using errcode='40001',message='STALE_DATA'; end if;
  if v_e.state not in ('PLANNED','TESTING','CORRECTION_REQUESTED') then raise exception using errcode='55000',message='INVALID_STATE'; end if;
  select i,d.code into v_item,v_code from public.test_plan_items i join public.test_definitions d on d.id=i.definition_id and d.rule_set_id=i.rule_set_id
    where i.id=p_plan_item_id and i.evaluation_id=v_e.id and i.laboratory_id=v_e.laboratory_id and i.plan_id=v_e.current_plan_id;
  if not found or p_observations->>'type' is distinct from v_code then raise exception using errcode='22023',message='VALIDATION_ERROR'; end if;
  if jsonb_typeof(p_observations)<>'object' or jsonb_typeof(p_conditions)<>'object' or jsonb_typeof(p_equipment)<>'array' or jsonb_typeof(p_procedure_confirmations)<>'object' then raise exception using errcode='22023',message='VALIDATION_ERROR'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  if p_session_id is null then
    if exists(select 1 from public.test_sessions s where s.plan_item_id=v_item.id) then raise exception using errcode='55000',message='RETEST_REQUIRED'; end if;
    v_session_id:=gen_random_uuid(); v_attempt:=1;
    insert into public.test_sessions(id,laboratory_id,evaluation_id,plan_item_id,attempt_no,state,row_version,observation_schema_version,conditions,equipment_snapshot,procedure_confirmations,performed_at,observer_id,remarks)
    values(v_session_id,v_e.laboratory_id,v_e.id,v_item.id,v_attempt,'DRAFT',1,'1',p_conditions,p_equipment,p_procedure_confirmations,now(),p_actor_id,nullif(btrim(p_remarks),''));
  else
    select s.* into v_s from public.test_sessions s where s.id=p_session_id and s.evaluation_id=v_e.id and s.plan_item_id=v_item.id for update;
    if not found then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
    if v_s.state<>'DRAFT' then raise exception using errcode='55000',message='COMPLETED_ATTEMPT_IMMUTABLE'; end if;
    if v_s.row_version<>p_expected_session_version then raise exception using errcode='40001',message='STALE_DATA'; end if;
    v_session_id:=v_s.id; v_attempt:=v_s.attempt_no;
    update public.test_sessions s set conditions=p_conditions,equipment_snapshot=p_equipment,procedure_confirmations=p_procedure_confirmations,
      performed_at=now(),remarks=nullif(btrim(p_remarks),''),row_version=s.row_version+1 where s.id=v_s.id;
  end if;
  insert into public.test_observations(laboratory_id,evaluation_id,session_id,row_key,sequence_no,row_version,payload)
    values(v_e.laboratory_id,v_e.id,v_session_id,'observations',1,1,p_observations)
    on conflict(session_id,row_key) do update set payload=excluded.payload,row_version=public.test_observations.row_version+1;
  update public.evaluations e set state='TESTING',row_version=e.row_version+1 where e.id=v_e.id;
  select s.* into v_s from public.test_sessions s where s.id=v_session_id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
    values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','OBSERVATIONS_SAVED','test_sessions',v_session_id::text,jsonb_build_object('attemptNo',v_attempt,'testCode',v_code));
  return jsonb_build_object('sessionId',v_session_id,'sessionVersion',v_s.row_version,'evaluationVersion',v_e.row_version+1);
end $$;

create or replace function public.command_start_retest(p_actor_id uuid,p_evaluation_id uuid,p_plan_item_id uuid,p_expected_evaluation_version bigint,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_item public.test_plan_items; v_previous public.test_sessions; v_id uuid:=gen_random_uuid(); v_attempt integer;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  if v_e.row_version<>p_expected_evaluation_version then raise exception using errcode='40001',message='STALE_DATA'; end if;
  if v_e.state not in ('TESTING','CORRECTION_REQUESTED') or nullif(btrim(p_reason),'') is null then raise exception using errcode='55000',message='INVALID_STATE'; end if;
  select i.* into v_item from public.test_plan_items i where i.id=p_plan_item_id and i.evaluation_id=v_e.id and i.plan_id=v_e.current_plan_id;
  if not found then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
  select s.* into v_previous from public.test_sessions s where s.plan_item_id=v_item.id order by s.attempt_no desc limit 1 for update;
  if not found or v_previous.state<>'COMPLETED' then raise exception using errcode='55000',message='RETEST_REQUIRES_COMPLETED_ATTEMPT'; end if;
  v_attempt:=v_previous.attempt_no+1; perform set_config('app.actor_id',p_actor_id::text,true);
  insert into public.test_sessions(id,laboratory_id,evaluation_id,plan_item_id,attempt_no,state,row_version,observation_schema_version,conditions,equipment_snapshot,procedure_confirmations,performed_at,observer_id,retest_reason)
  values(v_id,v_e.laboratory_id,v_e.id,v_item.id,v_attempt,'DRAFT',0,'1','{}','[]','{}',now(),p_actor_id,btrim(p_reason));
  update public.evaluations e set state='TESTING',row_version=e.row_version+1 where e.id=v_e.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','RETEST_STARTED','test_sessions',v_id::text,jsonb_build_object('attemptNo',v_attempt,'reason',btrim(p_reason)));
  return jsonb_build_object('sessionId',v_id,'attemptNo',v_attempt,'evaluationVersion',v_e.row_version+1);
end $$;

create or replace function public.command_record_result(
  p_actor_id uuid,p_evaluation_id uuid,p_session_id uuid,p_expected_evaluation_version bigint,p_expected_session_version bigint,
  p_input_snapshot jsonb,p_input_sha256 text,p_engine_version text,p_outcome public.result_outcome,p_evaluation jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_s public.test_sessions; v_i public.test_plan_items; v_p public.test_plans; v_spec public.specification_revisions; v_obs jsonb; v_current jsonb; v_id uuid;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  if v_e.row_version<>p_expected_evaluation_version then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select s.* into v_s from public.test_sessions s where s.id=p_session_id and s.evaluation_id=v_e.id for update;
  if not found or v_s.state<>'DRAFT' or v_s.row_version<>p_expected_session_version then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select i.* into v_i from public.test_plan_items i where i.id=v_s.plan_item_id and i.plan_id=v_e.current_plan_id;
  select p.* into v_p from public.test_plans p where p.id=v_e.current_plan_id and p.specification_id=v_e.current_specification_id;
  select s.* into v_spec from public.specification_revisions s where s.id=v_e.current_specification_id;
  select o.payload into v_obs from public.test_observations o where o.session_id=v_s.id and o.row_key='observations';
  v_current:=jsonb_build_object('specification',jsonb_build_object('id',v_spec.id,'version_no',v_spec.version_no,'accuracy_class',v_spec.accuracy_class,'max_g',v_spec.max_g::text,'min_g',v_spec.min_g::text,'e_g',v_spec.e_g::text,'d_g',v_spec.d_g::text,'features',v_spec.features),'configuration',v_i.configuration,
    'observations',v_obs,'conditions',v_s.conditions,'equipment',v_s.equipment_snapshot,'procedureConfirmations',v_s.procedure_confirmations,
    'sessionVersion',v_s.row_version,'planId',v_p.id,'ruleSetId',v_p.rule_set_id);
  if v_current is distinct from p_input_snapshot or p_evaluation->>'inputSha256' is distinct from p_input_sha256
    or p_evaluation->>'sessionId' is distinct from v_s.id::text or (p_evaluation->>'sessionVersion')::bigint is distinct from v_s.row_version
    or p_evaluation->>'outcome' is distinct from p_outcome::text or p_input_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception using errcode='40001',message='STALE_DATA';
  end if;
  if p_outcome in ('NOT_SUPPORTED','NOT_VERIFIED') then raise exception using errcode='22023',message='UNSUPPORTED_RESULT_NOT_PERSISTED'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  insert into public.test_results(laboratory_id,evaluation_id,session_id,session_version,rule_set_id,engine_version,input_sha256,outcome,evaluation_json)
    values(v_e.laboratory_id,v_e.id,v_s.id,v_s.row_version,v_p.rule_set_id,p_engine_version,p_input_sha256,p_outcome,p_evaluation)
    on conflict(session_id,session_version,engine_version) do nothing returning id into v_id;
  if v_id is null then select r.id into v_id from public.test_results r where r.session_id=v_s.id and r.session_version=v_s.row_version and r.engine_version=p_engine_version and r.input_sha256=p_input_sha256; end if;
  if v_id is null then raise exception using errcode='23505',message='RESULT_CONFLICT'; end if;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','RESULT_CALCULATED','test_results',v_id::text,jsonb_build_object('outcome',p_outcome,'inputSha256',p_input_sha256));
  return jsonb_build_object('sessionId',v_s.id,'sessionVersion',v_s.row_version,'evaluation',p_evaluation,'version',v_s.row_version);
end $$;

create or replace function public.command_complete_test(p_actor_id uuid,p_evaluation_id uuid,p_session_id uuid,p_expected_evaluation_version bigint,p_expected_session_version bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_s public.test_sessions; v_result public.test_results;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  if v_e.row_version<>p_expected_evaluation_version or v_e.state<>'TESTING' then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select s.* into v_s from public.test_sessions s where s.id=p_session_id and s.evaluation_id=v_e.id for update;
  if not found or v_s.state<>'DRAFT' or v_s.row_version<>p_expected_session_version then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select r.* into v_result from public.test_results r where r.session_id=v_s.id and r.session_version=v_s.row_version and r.outcome in ('PASS','FAIL') order by r.evaluated_at desc limit 1;
  if not found then raise exception using errcode='55000',message='CURRENT_PASS_OR_FAIL_RESULT_REQUIRED'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  update public.test_sessions s set state='COMPLETED',completed_at=now(),row_version=s.row_version+1 where s.id=v_s.id;
  update public.evaluations e set row_version=e.row_version+1 where e.id=v_e.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','TEST_COMPLETED','test_sessions',v_s.id::text,jsonb_build_object('outcome',v_result.outcome));
  return jsonb_build_object('sessionId',v_s.id,'outcome',v_result.outcome,'evaluationVersion',v_e.row_version+1,'version',v_s.row_version+1);
end $$;

create or replace function public.command_mark_ready(p_actor_id uuid,p_evaluation_id uuid,p_expected_evaluation_version bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_required integer; v_complete integer;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  if v_e.row_version<>p_expected_evaluation_version or v_e.state<>'TESTING' then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select count(*) into v_required from public.test_plan_items i where i.plan_id=v_e.current_plan_id and i.coverage='REQUIRED';
  select count(*) into v_complete from public.test_plan_items i where i.plan_id=v_e.current_plan_id and i.coverage='REQUIRED' and exists(
    select 1 from public.test_sessions s where s.plan_item_id=i.id and s.state='COMPLETED' and s.attempt_no=(select max(x.attempt_no) from public.test_sessions x where x.plan_item_id=i.id)
      and exists(select 1 from public.test_results r where r.session_id=s.id and r.session_version=s.row_version-1 and r.outcome in ('PASS','FAIL')));
  if v_required<>3 or v_complete<>v_required then raise exception using errcode='55000',message='SELECTED_TESTS_INCOMPLETE'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  update public.evaluations e set state='READY_FOR_REVIEW',overall_conformity='NOT_DETERMINED',row_version=e.row_version+1 where e.id=v_e.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','SELECTED_TESTS_READY','evaluations',v_e.id::text);
  return jsonb_build_object('evaluationId',v_e.id,'state','READY_FOR_REVIEW','evaluationVersion',v_e.row_version+1,'version',v_e.row_version+1);
end $$;

create or replace function public.command_submit(p_actor_id uuid,p_evaluation_id uuid,p_expected_evaluation_version bigint,p_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_report public.reports; v_version integer; v_id uuid:=gen_random_uuid(); v_hash text; v_rule_set text;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  if v_e.row_version<>p_expected_evaluation_version or v_e.state<>'READY_FOR_REVIEW' then raise exception using errcode='40001',message='STALE_DATA'; end if;
  if p_snapshot->>'evaluationId' is distinct from v_e.id::text or p_snapshot->>'kind' is distinct from 'SUBMITTED' or p_snapshot->>'overallConformity' is distinct from 'NOT_DETERMINED' then raise exception using errcode='22023',message='INVALID_SNAPSHOT'; end if;
  if exists(select 1 from public.attachments a where a.evaluation_id=v_e.id and a.state='PENDING') then raise exception using errcode='55000',message='PENDING_EVIDENCE'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  select r.* into v_report from public.reports r where r.evaluation_id=v_e.id for update;
  if not found then
    insert into public.reports(laboratory_id,evaluation_id,report_number) values(v_e.laboratory_id,v_e.id,'NAWI-'||to_char(current_date,'YYYY')||'-'||upper(substr(replace(v_e.id::text,'-',''),1,10))) returning * into v_report;
  end if;
  select coalesce(max(rv.version_no),0)+1 into v_version from public.report_versions rv where rv.report_id=v_report.id;
  p_snapshot:=jsonb_set(jsonb_set(p_snapshot,'{reportId}',to_jsonb(v_report.id::text)),'{reportNumber}',to_jsonb(v_report.report_number));
  p_snapshot:=jsonb_set(p_snapshot,'{versionNo}',to_jsonb(v_version));
  v_hash:=encode(extensions.digest(convert_to(p_snapshot::text,'utf8'),'sha256'),'hex');
  select p.rule_set_id into strict v_rule_set from public.test_plans p where p.id=v_e.current_plan_id;
  insert into public.report_versions(id,laboratory_id,evaluation_id,report_id,version_no,kind,snapshot_schema_version,snapshot,snapshot_sha256,rule_set_id,created_by)
  values(v_id,v_e.laboratory_id,v_e.id,v_report.id,v_version,'SUBMITTED','1',p_snapshot,v_hash,v_rule_set,p_actor_id);
  update public.evaluations e set current_submission_id=v_id,state='UNDER_REVIEW',row_version=e.row_version+1 where e.id=v_e.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','REPORT_SUBMITTED','report_versions',v_id::text,jsonb_build_object('versionNo',v_version,'snapshotSha256',v_hash));
  return jsonb_build_object('submissionId',v_id,'reportId',v_report.id,'reportNumber',v_report.report_number,'versionNo',v_version,'snapshotSha256',v_hash,'state','UNDER_REVIEW','evaluationVersion',v_e.row_version+1,'version',v_e.row_version+1);
end $$;

create or replace function public.command_review(p_actor_id uuid,p_evaluation_id uuid,p_expected_evaluation_version bigint,p_submission_id uuid,p_submission_sha256 text,p_decision public.review_decision,p_comment text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_submission public.report_versions; v_event uuid:=gen_random_uuid(); v_state public.evaluation_state; v_has_fail boolean;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'APPROVER');
  if v_e.row_version<>p_expected_evaluation_version or v_e.state<>'UNDER_REVIEW' or v_e.current_submission_id is distinct from p_submission_id then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select rv.* into v_submission from public.report_versions rv where rv.id=p_submission_id and rv.evaluation_id=v_e.id and rv.kind='SUBMITTED';
  if not found or v_submission.snapshot_sha256 is distinct from p_submission_sha256 then raise exception using errcode='40001',message='STALE_DATA'; end if;
  v_has_fail:=jsonb_path_exists(v_submission.snapshot,'$.testData[*].evaluation ? (@.outcome == "FAIL")');
  if (p_decision<>'APPROVE' or v_has_fail) and nullif(btrim(p_comment),'') is null then raise exception using errcode='22023',message='COMMENT_REQUIRED'; end if;
  v_state:=case p_decision when 'APPROVE' then 'APPROVED'::public.evaluation_state when 'REJECT' then 'REJECTED'::public.evaluation_state else 'CORRECTION_REQUESTED'::public.evaluation_state end;
  perform set_config('app.actor_id',p_actor_id::text,true);
  insert into public.approval_events(id,laboratory_id,evaluation_id,submission_version_id,decision,comment,actor_id)
  values(v_event,v_e.laboratory_id,v_e.id,v_submission.id,p_decision,nullif(btrim(p_comment),''),p_actor_id);
  update public.evaluations e set state=v_state,row_version=e.row_version+1 where e.id=v_e.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','REPORT_REVIEWED','approval_events',v_event::text,jsonb_build_object('decision',p_decision,'submissionSha256',p_submission_sha256));
  return jsonb_build_object('approvalEventId',v_event,'decision',p_decision,'state',v_state,'evaluationVersion',v_e.row_version+1,'version',v_e.row_version+1);
end $$;

create or replace function public.command_prepare_final(p_actor_id uuid,p_evaluation_id uuid,p_expected_evaluation_version bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_submission public.report_versions; v_approval public.approval_events; v_profile public.profiles; v_final public.report_versions; v_artifact public.report_artifacts; v_artifact_id uuid:=gen_random_uuid(); v_version integer; v_generated timestamptz:=now(); v_snapshot jsonb; v_hash text;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'APPROVER');
  if v_e.row_version<>p_expected_evaluation_version or v_e.state<>'APPROVED' then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select rv.* into v_submission from public.report_versions rv where rv.id=v_e.current_submission_id and rv.kind='SUBMITTED';
  select a.* into v_approval from public.approval_events a where a.submission_version_id=v_submission.id and a.decision='APPROVE';
  select p.* into v_profile from public.profiles p where p.id=v_approval.actor_id and p.active and p.laboratory_id=v_e.laboratory_id;
  if not found then raise exception using errcode='55000',message='APPROVAL_REQUIRED'; end if;
  select rv.* into v_final from public.report_versions rv where rv.derived_from_id=v_submission.id and rv.kind='FINAL';
  if found then
    select a.* into v_artifact from public.report_artifacts a where a.report_version_id=v_final.id and a.format='PDF';
    if v_artifact.state='FAILED' then perform set_config('app.actor_id',p_actor_id::text,true); update public.report_artifacts a set state='PENDING',last_error_code=null where a.id=v_artifact.id returning * into v_artifact; end if;
    return jsonb_build_object('reportVersionId',v_final.id,'artifactId',v_artifact.id,'storagePath',v_artifact.storage_path,'snapshot',v_final.snapshot,'snapshotSha256',v_final.snapshot_sha256,'artifactState',v_artifact.state,'evaluationVersion',v_e.row_version,'version',v_e.row_version);
  end if;
  select coalesce(max(rv.version_no),0)+1 into v_version from public.report_versions rv where rv.report_id=v_submission.report_id;
  v_snapshot:=jsonb_set(jsonb_set(jsonb_set(v_submission.snapshot,'{kind}','"FINAL"'::jsonb),'{versionNo}',to_jsonb(v_version)),'{generatedAt}',to_jsonb(v_generated::text));
  v_snapshot:=jsonb_set(v_snapshot,'{approval}',jsonb_build_object('actorId',v_approval.actor_id,'displayName',v_profile.display_name,'decidedAt',v_approval.created_at,'submissionVersionId',v_submission.id,'submissionSha256',v_submission.snapshot_sha256,'comment',v_approval.comment));
  v_hash:=encode(extensions.digest(convert_to(v_snapshot::text,'utf8'),'sha256'),'hex');
  perform set_config('app.actor_id',p_actor_id::text,true);
  insert into public.report_versions(laboratory_id,evaluation_id,report_id,version_no,kind,snapshot_schema_version,snapshot,snapshot_sha256,rule_set_id,derived_from_id,created_by)
  values(v_e.laboratory_id,v_e.id,v_submission.report_id,v_version,'FINAL','1',v_snapshot,v_hash,v_submission.rule_set_id,v_submission.id,p_actor_id) returning * into v_final;
  insert into public.report_artifacts(id,laboratory_id,evaluation_id,report_version_id,format,state,storage_path)
  values(v_artifact_id,v_e.laboratory_id,v_e.id,v_final.id,'PDF','PENDING',v_e.laboratory_id||'/'||v_e.id||'/'||v_final.id||'/'||v_artifact_id||'.pdf') returning * into v_artifact;
  return jsonb_build_object('reportVersionId',v_final.id,'artifactId',v_artifact.id,'storagePath',v_artifact.storage_path,'snapshot',v_snapshot,'snapshotSha256',v_hash,'artifactState','PENDING','evaluationVersion',v_e.row_version,'version',v_e.row_version);
end $$;

create or replace function public.command_finish_artifact(p_actor_id uuid,p_evaluation_id uuid,p_expected_evaluation_version bigint,p_artifact_id uuid,p_sha256 text,p_byte_length bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_a public.report_artifacts;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'APPROVER');
  if v_e.row_version<>p_expected_evaluation_version or v_e.state<>'APPROVED' or p_sha256 !~ '^[a-f0-9]{64}$' or p_byte_length<=0 then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select a.* into v_a from public.report_artifacts a where a.id=p_artifact_id and a.evaluation_id=v_e.id and a.state='PENDING' for update;
  if not found then raise exception using errcode='55000',message='ARTIFACT_RESERVATION_REQUIRED'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  update public.report_artifacts a set state='READY',sha256=p_sha256,byte_length=p_byte_length,last_error_code=null where a.id=v_a.id;
  update public.evaluations e set state='ISSUED',row_version=e.row_version+1 where e.id=v_e.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','REPORT_ISSUED','report_artifacts',v_a.id::text,jsonb_build_object('sha256',p_sha256,'byteLength',p_byte_length));
  return jsonb_build_object('artifactId',v_a.id,'state','READY','evaluationState','ISSUED','sha256',p_sha256,'byteLength',p_byte_length,'evaluationVersion',v_e.row_version+1,'version',v_e.row_version+1);
end $$;

create or replace function public.command_fail_artifact(p_actor_id uuid,p_evaluation_id uuid,p_artifact_id uuid,p_error_code text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_a public.report_artifacts;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'APPROVER');
  select a.* into v_a from public.report_artifacts a where a.id=p_artifact_id and a.evaluation_id=v_e.id and a.state='PENDING' for update;
  if not found or v_e.state<>'APPROVED' then raise exception using errcode='55000',message='ARTIFACT_RESERVATION_REQUIRED'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  update public.report_artifacts a set state='FAILED',last_error_code=left(coalesce(nullif(p_error_code,''),'PDF_GENERATION_FAILED'),80) where a.id=v_a.id;
  return jsonb_build_object('artifactId',v_a.id,'state','FAILED','evaluationState','APPROVED','version',v_e.row_version);
end $$;

create or replace function public.command_reserve_attachment(p_actor_id uuid,p_evaluation_id uuid,p_session_id uuid,p_original_name text,p_media_type text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_s public.test_sessions; v_id uuid:=gen_random_uuid(); v_safe text; v_path text;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  select s.* into v_s from public.test_sessions s where s.id=p_session_id and s.evaluation_id=v_e.id and s.state='DRAFT';
  if not found or v_e.state not in ('TESTING','CORRECTION_REQUESTED') or p_media_type not in ('application/pdf','image/png','image/jpeg') then raise exception using errcode='22023',message='INVALID_ATTACHMENT'; end if;
  v_safe:=regexp_replace(left(coalesce(nullif(p_original_name,''),'evidence'),120),'[^A-Za-z0-9._-]','_','g');
  v_path:=v_e.laboratory_id||'/'||v_e.id||'/'||v_id||'/'||v_safe;
  perform set_config('app.actor_id',p_actor_id::text,true);
  insert into public.attachments(id,laboratory_id,evaluation_id,session_id,storage_path,original_name,media_type,state,uploaded_by)
  values(v_id,v_e.laboratory_id,v_e.id,v_s.id,v_path,v_safe,p_media_type,'PENDING',p_actor_id);
  return jsonb_build_object('attachmentId',v_id,'storagePath',v_path,'version',v_s.row_version);
end $$;

create or replace function public.command_finish_attachment(p_actor_id uuid,p_evaluation_id uuid,p_attachment_id uuid,p_sha256 text,p_byte_length bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_a public.attachments;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  select a.* into v_a from public.attachments a where a.id=p_attachment_id and a.evaluation_id=v_e.id and a.state='PENDING' for update;
  if not found or p_sha256 !~ '^[a-f0-9]{64}$' or p_byte_length<=0 or p_byte_length>2097152 then raise exception using errcode='22023',message='INVALID_ATTACHMENT'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  update public.attachments a set state='READY',sha256=p_sha256,byte_length=p_byte_length where a.id=v_a.id;
  return jsonb_build_object('attachmentId',v_a.id,'state','READY','sha256',p_sha256,'byteLength',p_byte_length,'version',v_e.row_version);
end $$;

create or replace function public.command_fail_attachment(p_actor_id uuid,p_evaluation_id uuid,p_attachment_id uuid,p_error_code text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_a public.attachments;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  select a.* into v_a from public.attachments a where a.id=p_attachment_id and a.evaluation_id=v_e.id and a.state='PENDING' for update;
  if not found then raise exception using errcode='55000',message='ATTACHMENT_RESERVATION_REQUIRED'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  update public.attachments a set state='FAILED' where a.id=v_a.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','ATTACHMENT_FAILED','attachments',v_a.id::text,jsonb_build_object('errorCode',left(coalesce(p_error_code,'UPLOAD_FAILED'),80)));
  return jsonb_build_object('attachmentId',v_a.id,'state','FAILED','version',v_e.row_version);
end $$;

do $$ declare v_name text; v_signature text; begin
  foreach v_signature in array array[
    'public.command_save_observations(uuid,uuid,uuid,uuid,bigint,bigint,jsonb,jsonb,jsonb,jsonb,text)',
    'public.command_start_retest(uuid,uuid,uuid,bigint,text)',
    'public.command_record_result(uuid,uuid,uuid,bigint,bigint,jsonb,text,text,public.result_outcome,jsonb)',
    'public.command_complete_test(uuid,uuid,uuid,bigint,bigint)',
    'public.command_mark_ready(uuid,uuid,bigint)',
    'public.command_submit(uuid,uuid,bigint,jsonb)',
    'public.command_review(uuid,uuid,bigint,uuid,text,public.review_decision,text)',
    'public.command_prepare_final(uuid,uuid,bigint)',
    'public.command_finish_artifact(uuid,uuid,bigint,uuid,text,bigint)',
    'public.command_fail_artifact(uuid,uuid,uuid,text)',
    'public.command_reserve_attachment(uuid,uuid,uuid,text,text)',
    'public.command_finish_attachment(uuid,uuid,uuid,text,bigint)',
    'public.command_fail_attachment(uuid,uuid,uuid,text)'
  ] loop
    execute 'revoke all on function '||v_signature||' from public,anon,authenticated';
    execute 'grant execute on function '||v_signature||' to service_role';
  end loop;
end $$;

commit;
