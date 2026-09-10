-- Supabase RLS and immutability foundation. Read with docs/security-contract.md.
-- Application command RPCs are deliberately not stubbed as working functions.
begin;
create function private.my_laboratory() returns uuid
language sql stable security definer set search_path = '' as $$
  select laboratory_id from public.profiles where id = auth.uid() and active;
$$;
create function private.can_read_evaluation(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.evaluations e join public.profiles p
      on p.laboratory_id = e.laboratory_id
    where e.id = p_id and p.id = auth.uid() and p.active
      and (p.role in ('APPROVER','ADMIN') or e.assigned_tester_id = p.id)
  );
$$;
revoke all on function private.my_laboratory() from public;
revoke all on function private.can_read_evaluation(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.my_laboratory() to authenticated;
grant execute on function private.can_read_evaluation(uuid) to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'laboratories','profiles','parties','instrument_models','instruments',
    'evaluations','specification_revisions','standard_documents','rule_sets',
    'test_definitions','test_plans','test_plan_items','test_equipment',
    'test_sessions','test_observations','test_results','reports','report_versions',
    'approval_events','report_artifacts','attachments','audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from anon, authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('grant all on table public.%I to service_role',t);
  end loop;
  foreach t in array array['profiles','parties','instrument_models','instruments','test_equipment'] loop
    execute format('create policy lab_read on public.%I for select to authenticated using (laboratory_id = (select private.my_laboratory()))',t);
  end loop;
  foreach t in array array['specification_revisions','test_plans','test_plan_items','test_sessions','test_observations','test_results','reports','report_versions','approval_events','report_artifacts','attachments'] loop
    execute format('create policy evaluation_read on public.%I for select to authenticated using (private.can_read_evaluation(evaluation_id))',t);
  end loop;
  foreach t in array array['standard_documents','rule_sets','test_definitions'] loop
    execute format('create policy reference_read on public.%I for select to authenticated using ((select private.my_laboratory()) is not null)',t);
  end loop;
end $$;
grant usage,select on sequence public.audit_logs_id_seq to service_role;
create policy lab_read on public.laboratories for select to authenticated
  using (id = (select private.my_laboratory()));
create policy evaluation_read on public.evaluations for select to authenticated
  using (private.can_read_evaluation(id));
create policy audit_read on public.audit_logs for select to authenticated using (
  laboratory_id = (select private.my_laboratory()) and
  (private.can_read_evaluation(evaluation_id) or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.active
    and p.laboratory_id = audit_logs.laboratory_id and p.role in ('ADMIN','APPROVER')
  ))
);

create function private.immutable_record() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception using errcode = '55000', message = 'IMMUTABLE_RECORD';
end;
$$;
create function private.guard_raw_data() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r jsonb; ev public.evaluations; actor uuid; actor_role public.lab_role;
begin
  r := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  actor := nullif(current_setting('app.actor_id',true),'')::uuid;
  if actor is null then
    raise exception using errcode = '42501', message = 'COMMAND_CONTEXT_REQUIRED';
  end if;
  select * into strict ev from public.evaluations
    where id = (r->>'evaluation_id')::uuid for update;
  select role into actor_role from public.profiles
    where id = actor and laboratory_id = ev.laboratory_id and active;
  if actor_role is distinct from 'TESTER'::public.lab_role
    or actor is distinct from ev.assigned_tester_id then
    raise exception using errcode = '42501', message = 'TESTER_PERMISSION_REQUIRED';
  end if;
  if ev.state not in ('DRAFT','PLANNED','TESTING','CORRECTION_REQUESTED') then
    raise exception using errcode = '55000', message = 'EVALUATION_LOCKED';
  end if;
  if tg_op = 'UPDATE' and
    ((to_jsonb(old)->>'laboratory_id') is distinct from (r->>'laboratory_id') or
     (to_jsonb(old)->>'evaluation_id') is distinct from (r->>'evaluation_id') or
     (to_jsonb(old)->>'session_id') is distinct from (r->>'session_id')) then
    raise exception using errcode = '55000', message = 'PARENT_ID_IMMUTABLE';
  end if;
  if tg_table_name = 'test_sessions' and tg_op <> 'INSERT' and to_jsonb(old)->>'state' = 'COMPLETED' then
    raise exception using errcode = '55000', message = 'COMPLETED_ATTEMPT_IMMUTABLE';
  end if;
  if tg_table_name in ('test_observations','attachments') and r->>'session_id' is not null
    and exists(select 1 from public.test_sessions
      where id = (r->>'session_id')::uuid and state = 'COMPLETED') then
    raise exception using errcode = '55000', message = 'COMPLETED_ATTEMPT_IMMUTABLE';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
-- Every command RPC must set this LOCAL transaction context only after actor checks.
-- Do not expose any setter for app.actor_id to authenticated clients.
create function private.audit_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r jsonb; actor uuid; ev_id uuid; lab_id uuid;
begin
  r := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  actor := nullif(current_setting('app.actor_id',true),'')::uuid;
  lab_id := (r->>'laboratory_id')::uuid;
  ev_id := case when tg_table_name = 'evaluations' then (r->>'id')::uuid
                else (r->>'evaluation_id')::uuid end;
  if actor is null or not exists(select 1 from public.profiles
    where id = actor and laboratory_id = lab_id and active) then
    raise exception using errcode = '42501', message = 'COMMAND_CONTEXT_REQUIRED';
  end if;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,
    action,entity_type,entity_id,old_value,new_value)
  values (lab_id,ev_id,actor,'USER',tg_table_name || '.' || lower(tg_op),tg_table_name,
    r->>'id',case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end);
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
create function private.guard_ready_artifact() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.state = 'READY' then
    raise exception using errcode = '55000', message = 'READY_ARTIFACT_IMMUTABLE';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
do $$
declare t text;
begin
  foreach t in array array['specification_revisions','standard_documents','rule_sets',
    'test_definitions','test_plans','test_plan_items','test_results','reports',
    'report_versions','approval_events','audit_logs'] loop
    execute format('create trigger immutable_record before update or delete on public.%I for each row execute function private.immutable_record()',t);
  end loop;
  foreach t in array array['specification_revisions','test_plans','test_plan_items',
    'test_sessions','test_observations','attachments'] loop
    execute format('create trigger guard_raw_data before insert or update or delete on public.%I for each row execute function private.guard_raw_data()',t);
  end loop;
  foreach t in array array['evaluations','specification_revisions','test_plans',
    'test_plan_items','test_sessions','test_observations','test_results','reports',
    'report_versions','approval_events','report_artifacts','attachments'] loop
    execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function private.audit_change()',t);
  end loop;
  foreach t in array array['laboratories','profiles','parties','instrument_models',
    'instruments','evaluations','test_equipment','test_sessions','test_observations',
    'report_artifacts','attachments'] loop
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function private.touch_updated_at()',t);
  end loop;
end $$;
create trigger immutable_ready_artifact before update or delete on public.report_artifacts
  for each row execute function private.guard_ready_artifact();
revoke all on function private.immutable_record() from public;
revoke all on function private.guard_raw_data() from public;
revoke all on function private.audit_change() from public;
revoke all on function private.guard_ready_artifact() from public;
revoke all on function private.touch_updated_at() from public;

-- Buckets stay private. No client write policy: P0 file uploads are authorized
-- server operations and small (2 MiB app cap). Larger signed-upload support is P1.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('nawi-evidence','nawi-evidence',false,2097152,array['application/pdf','image/png','image/jpeg']),
  ('nawi-reports','nawi-reports',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
create policy nawi_evidence_read on storage.objects for select to authenticated using (
  bucket_id = 'nawi-evidence' and exists (
    select 1 from public.attachments a where a.storage_path = name and a.state = 'READY'
      and private.can_read_evaluation(a.evaluation_id)
  )
);
create policy nawi_report_read on storage.objects for select to authenticated using (
  bucket_id = 'nawi-reports' and exists (
    select 1 from public.report_artifacts a where a.storage_path = name and a.state = 'READY'
      and private.can_read_evaluation(a.evaluation_id)
  )
);
commit;
