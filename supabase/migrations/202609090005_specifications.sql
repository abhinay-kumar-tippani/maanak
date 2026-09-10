-- Versioned specification revisions and manual intake persistence.
begin;

create function public.command_save_specification(
  p_actor_id uuid,
  p_evaluation_id uuid,
  p_expected_row_version bigint,
  p_accuracy_class text,
  p_max_g numeric,
  p_min_g numeric,
  p_e_g numeric,
  p_d_g numeric,
  p_features jsonb
) returns table (
  id uuid,
  evaluation_id uuid,
  version_no integer,
  accuracy_class text,
  max_g numeric,
  min_g numeric,
  e_g numeric,
  d_g numeric,
  features jsonb,
  recorded_by uuid,
  created_at timestamptz,
  resulting_evaluation_state public.evaluation_state,
  resulting_row_version bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evaluation public.evaluations;
  v_actor_laboratory_id uuid;
  v_revision_id uuid;
  v_version integer;
  v_new_row_version bigint;
begin
  select laboratory_id into v_actor_laboratory_id
  from public.profiles
  where id = p_actor_id and active and role = 'TESTER'::public.lab_role;
  if v_actor_laboratory_id is null then
    raise exception using errcode = '42501', message = 'PERMISSION_DENIED';
  end if;

  select * into strict v_evaluation
  from public.evaluations
  where id = p_evaluation_id
  for update;

  if v_evaluation.laboratory_id <> v_actor_laboratory_id
    or v_evaluation.assigned_tester_id <> p_actor_id then
    raise exception using errcode = '42501', message = 'ASSIGNMENT_REQUIRED';
  end if;
  if v_evaluation.row_version <> p_expected_row_version then
    raise exception using errcode = '40001', message = 'STALE_DATA';
  end if;
  if v_evaluation.state not in ('DRAFT','PLANNED','TESTING','CORRECTION_REQUESTED') then
    raise exception using errcode = '55000', message = 'EVALUATION_FINALIZED';
  end if;
  if p_accuracy_class not in ('I','II','III','IIII')
    or p_max_g is null or p_max_g <= 0
    or p_min_g is null or p_min_g < 0 or p_min_g > p_max_g
    or p_e_g is null or p_e_g <= 0
    or p_d_g is null or p_d_g <= 0
    or p_features is null
    or p_features->>'rangeType' is null or p_features->>'rangeType' not in ('SINGLE_INTERVAL','MULTI_INTERVAL','MULTIPLE_RANGE')
    or p_features->>'category' is null or p_features->>'category' not in ('COMPLETE_INSTRUMENT','MODULE')
    or p_features->>'indication' is null or p_features->>'indication' not in ('DIGITAL','ANALOG','NON_SELF_INDICATING')
    or p_features->>'receptor' is null or p_features->>'receptor' not in ('ORDINARY_PLATFORM','SPECIAL','ROLLING_LOAD')
    or p_features->>'auxiliaryIndication' is null or p_features->>'auxiliaryIndication' not in ('true','false')
    or p_features->>'extendedIndicationUsed' is null or p_features->>'extendedIndicationUsed' not in ('true','false')
    or p_features->>'isGradingInstrument' is null or p_features->>'isGradingInstrument' not in ('true','false')
    or p_features->>'automaticZeroSettingExists' is null or p_features->>'automaticZeroSettingExists' not in ('true','false')
    or p_features->>'zeroTrackingExists' is null or p_features->>'zeroTrackingExists' not in ('true','false')
    or p_features->>'supportPoints' is null or p_features->>'supportPoints' !~ '^[0-9]+$'
    or (p_features->>'supportPoints')::numeric <= 0
    or p_features->>'maximumAdditiveTareG' is null or p_features->>'maximumAdditiveTareG' !~ '^[0-9]+(\.[0-9]+)?$'
    or (p_features->>'maximumAdditiveTareG')::numeric < 0
    or p_features->>'initialZeroSettingRangePercent' is null or p_features->>'initialZeroSettingRangePercent' !~ '^[0-9]+(\.[0-9]+)?$'
    or (p_features->>'initialZeroSettingRangePercent')::numeric < 0
    or p_features->>'declaredTemperatureMinC' is null or p_features->>'declaredTemperatureMinC' !~ '^-?[0-9]+(\.[0-9]+)?$'
    or p_features->>'declaredTemperatureMaxC' is null or p_features->>'declaredTemperatureMaxC' !~ '^-?[0-9]+(\.[0-9]+)?$'
    or (p_features->>'declaredTemperatureMinC')::numeric > (p_features->>'declaredTemperatureMaxC')::numeric
    or jsonb_typeof(p_features->'manualIntake') <> 'object'
    or p_features->'manualIntake'->>'documentReview' is null or p_features->'manualIntake'->>'documentReview' not in ('CONFIRMED','NOT_CONFIRMED','NOT_VERIFIED')
    or p_features->'manualIntake'->>'markings' is null or p_features->'manualIntake'->>'markings' not in ('CONFIRMED','NOT_CONFIRMED','NOT_VERIFIED')
    or p_features->'manualIntake'->>'sealing' is null or p_features->'manualIntake'->>'sealing' not in ('CONFIRMED','NOT_CONFIRMED','NOT_VERIFIED')
    or p_features->'manualIntake'->>'environment' is null or p_features->'manualIntake'->>'environment' not in ('CONFIRMED','NOT_CONFIRMED','NOT_VERIFIED') then
    raise exception using errcode = '22023', message = 'VALIDATION_ERROR';
  end if;

  perform set_config('app.actor_id', p_actor_id::text, true);
  select coalesce(max(version_no), 0) + 1 into v_version
  from public.specification_revisions
  where evaluation_id = p_evaluation_id;

  insert into public.specification_revisions (laboratory_id, evaluation_id, version_no, accuracy_class, max_g, min_g, e_g, d_g, features, recorded_by)
  values (v_actor_laboratory_id, p_evaluation_id, v_version, p_accuracy_class, p_max_g, p_min_g, p_e_g, p_d_g, p_features, p_actor_id)
  returning id into v_revision_id;

  v_new_row_version := v_evaluation.row_version + 1;
  update public.evaluations
  set current_specification_id = v_revision_id,
      current_plan_id = null,
      current_submission_id = null,
      state = 'DRAFT'::public.evaluation_state,
      row_version = v_new_row_version
  where id = p_evaluation_id;

  insert into public.audit_logs (laboratory_id, evaluation_id, actor_id, actor_kind, action, entity_type, entity_id, metadata)
  values (v_actor_laboratory_id, p_evaluation_id, p_actor_id, 'USER', 'specification.revised', 'specification_revision', v_revision_id::text,
          jsonb_build_object('version_no', v_version, 'previous_row_version', v_evaluation.row_version));

  return query
  select r.id, r.evaluation_id, r.version_no, r.accuracy_class, r.max_g, r.min_g, r.e_g, r.d_g, r.features, r.recorded_by, r.created_at,
         'DRAFT'::public.evaluation_state, v_new_row_version
  from public.specification_revisions r where r.id = v_revision_id;
exception
  when no_data_found then
    raise exception using errcode = '42501', message = 'ASSIGNMENT_REQUIRED';
end;
$$;

revoke all on function public.command_save_specification(uuid,uuid,bigint,text,numeric,numeric,numeric,numeric,jsonb) from public, anon, authenticated;
grant execute on function public.command_save_specification(uuid,uuid,bigint,text,numeric,numeric,numeric,numeric,jsonb) to service_role;

commit;
