-- Fix ambiguous output-column/table-column references in registration RPC.
begin;

create or replace function public.command_register_instrument(
  p_actor_id uuid,
  p_manufacturer_name text,
  p_manufacturer_address text,
  p_applicant_name text,
  p_applicant_address text,
  p_designation text,
  p_category text,
  p_description text,
  p_sample_identifier text,
  p_serial_number text,
  p_assigned_tester_id uuid
) returns table (
  instrument_id uuid,
  model_id uuid,
  manufacturer_id uuid,
  applicant_id uuid,
  evaluation_id uuid,
  application_number text,
  state public.evaluation_state,
  sample_identifier text,
  designation text,
  manufacturer_name text,
  applicant_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_laboratory_id uuid;
  v_assigned_laboratory_id uuid;
  v_manufacturer_id uuid;
  v_applicant_id uuid;
  v_model_id uuid;
  v_instrument_id uuid;
  v_evaluation_id uuid;
  v_application_number text;
begin
  if p_actor_id is null then
    raise exception using errcode = '42501', message = 'PERMISSION_DENIED';
  end if;

  select actor_profile.laboratory_id
    into v_laboratory_id
  from public.profiles as actor_profile
  where actor_profile.id = p_actor_id
    and actor_profile.active
    and actor_profile.role = 'TESTER'::public.lab_role;
  if v_laboratory_id is null then
    raise exception using errcode = '42501', message = 'PERMISSION_DENIED';
  end if;

  select assigned_profile.laboratory_id
    into v_assigned_laboratory_id
  from public.profiles as assigned_profile
  where assigned_profile.id = p_assigned_tester_id
    and assigned_profile.active
    and assigned_profile.role = 'TESTER'::public.lab_role;
  if v_assigned_laboratory_id is null
    or v_assigned_laboratory_id <> v_laboratory_id then
    raise exception using errcode = '42501', message = 'CROSS_LABORATORY_REFERENCE';
  end if;

  if nullif(btrim(p_manufacturer_name), '') is null
    or nullif(btrim(p_manufacturer_address), '') is null
    or nullif(btrim(p_applicant_name), '') is null
    or nullif(btrim(p_applicant_address), '') is null
    or nullif(btrim(p_designation), '') is null
    or p_category not in ('COMPLETE_INSTRUMENT', 'MODULE')
    or nullif(btrim(p_sample_identifier), '') is null then
    raise exception using errcode = '22023', message = 'VALIDATION_ERROR';
  end if;

  if exists (
    select 1
    from public.instruments as existing_instrument
    where existing_instrument.laboratory_id = v_laboratory_id
      and existing_instrument.sample_identifier = btrim(p_sample_identifier)
  ) then
    raise exception using errcode = '23505', message = 'DUPLICATE_SAMPLE';
  end if;

  -- All subsequent writes are atomic and use transaction-local actor context.
  perform set_config('app.actor_id', p_actor_id::text, true);

  select manufacturer_party.id
    into v_manufacturer_id
  from public.parties as manufacturer_party
  where manufacturer_party.laboratory_id = v_laboratory_id
    and manufacturer_party.name = btrim(p_manufacturer_name)
    and manufacturer_party.address = btrim(p_manufacturer_address)
  order by manufacturer_party.created_at
  limit 1;
  if v_manufacturer_id is null then
    insert into public.parties (laboratory_id, name, address)
    values (v_laboratory_id, btrim(p_manufacturer_name), btrim(p_manufacturer_address))
    returning id into v_manufacturer_id;
  end if;

  select applicant_party.id
    into v_applicant_id
  from public.parties as applicant_party
  where applicant_party.laboratory_id = v_laboratory_id
    and applicant_party.name = btrim(p_applicant_name)
    and applicant_party.address = btrim(p_applicant_address)
  order by applicant_party.created_at
  limit 1;
  if v_applicant_id is null then
    insert into public.parties (laboratory_id, name, address)
    values (v_laboratory_id, btrim(p_applicant_name), btrim(p_applicant_address))
    returning id into v_applicant_id;
  end if;

  insert into public.instrument_models (laboratory_id, manufacturer_id, designation, category, description)
  values (v_laboratory_id, v_manufacturer_id, btrim(p_designation), p_category, nullif(btrim(p_description), ''))
  returning id into v_model_id;

  insert into public.instruments (laboratory_id, model_id, applicant_id, sample_identifier, serial_number)
  values (v_laboratory_id, v_model_id, v_applicant_id, btrim(p_sample_identifier), nullif(btrim(p_serial_number), ''))
  returning id into v_instrument_id;

  v_application_number := 'SIH26035-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substr(gen_random_uuid()::text, 1, 8);
  insert into public.evaluations (laboratory_id, instrument_id, assigned_tester_id, application_number, state, is_demo)
  values (v_laboratory_id, v_instrument_id, p_assigned_tester_id, v_application_number, 'DRAFT'::public.evaluation_state, true)
  returning id into v_evaluation_id;

  insert into public.audit_logs (laboratory_id, evaluation_id, actor_id, actor_kind, action, entity_type, entity_id, metadata)
  values (v_laboratory_id, v_evaluation_id, p_actor_id, 'USER', 'instrument.registered', 'instrument', v_instrument_id::text,
          jsonb_build_object('model_id', v_model_id, 'sample_identifier', btrim(p_sample_identifier)));

  return query
  select v_instrument_id,
         v_model_id,
         v_manufacturer_id,
         v_applicant_id,
         v_evaluation_id,
         v_application_number,
         'DRAFT'::public.evaluation_state,
         btrim(p_sample_identifier),
         btrim(p_designation),
         btrim(p_manufacturer_name),
         btrim(p_applicant_name);
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'DUPLICATE_SAMPLE';
end;
$$;

revoke all on function public.command_register_instrument(uuid,text,text,text,text,text,text,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.command_register_instrument(uuid,text,text,text,text,text,text,text,text,text,uuid) to service_role;

commit;
