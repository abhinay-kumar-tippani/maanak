-- Command-boundary guards. Concrete command RPCs are added by later stages.
begin;

create function private.guard_evaluation_transition() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.id is distinct from old.id
    or new.laboratory_id is distinct from old.laboratory_id
    or new.instrument_id is distinct from old.instrument_id
    or new.assigned_tester_id is distinct from old.assigned_tester_id then
    raise exception using errcode = '55000', message = 'EVALUATION_IDENTITY_IMMUTABLE';
  end if;

  if new.row_version <> old.row_version + 1 then
    raise exception using errcode = '40001', message = 'STALE_DATA';
  end if;

  if new.state is distinct from old.state and not (
    (old.state = 'DRAFT' and new.state = 'PLANNED') or
    (old.state = 'PLANNED' and new.state in ('TESTING','DRAFT')) or
    (old.state = 'TESTING' and new.state in ('READY_FOR_REVIEW','DRAFT')) or
    (old.state = 'READY_FOR_REVIEW' and new.state in ('UNDER_REVIEW','TESTING')) or
    (old.state = 'UNDER_REVIEW' and new.state in ('APPROVED','CORRECTION_REQUESTED','REJECTED')) or
    (old.state = 'CORRECTION_REQUESTED' and new.state in ('TESTING','DRAFT')) or
    (old.state = 'APPROVED' and new.state = 'ISSUED') or
    (old.state = 'REJECTED' and new.state = 'ARCHIVED') or
    (old.state = 'ISSUED' and new.state = 'ARCHIVED')
  ) then
    raise exception using errcode = '55000', message = 'INVALID_STATE_TRANSITION';
  end if;

  if nullif(current_setting('app.actor_id', true), '') is null then
    raise exception using errcode = '42501', message = 'COMMAND_CONTEXT_REQUIRED';
  end if;
  return new;
end;
$$;

create trigger guard_evaluation_transition
  before update on public.evaluations
  for each row execute function private.guard_evaluation_transition();

revoke all on function private.guard_evaluation_transition() from public;
revoke insert, update, delete on all tables in schema public from anon, authenticated;

commit;
