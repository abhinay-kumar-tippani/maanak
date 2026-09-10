-- SIH26035 prototype foundation. Run in a NEW Supabase development project.
-- This is schema, not a complete application. Command RPCs are added at their
-- implementation stages; authenticated clients receive no business write grants.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;

create type public.lab_role as enum ('TESTER','APPROVER','ADMIN');
create type public.evaluation_state as enum (
  'DRAFT','PLANNED','TESTING','READY_FOR_REVIEW','UNDER_REVIEW',
  'CORRECTION_REQUESTED','APPROVED','REJECTED','ISSUED','ARCHIVED');
create type public.coverage_state as enum
  ('REQUIRED','NOT_APPLICABLE','NOT_IMPLEMENTED','UNVERIFIED');
create type public.result_outcome as enum
  ('PASS','FAIL','INCOMPLETE','INVALID','NOT_APPLICABLE','NOT_VERIFIED','NOT_SUPPORTED');
create type public.session_state as enum ('DRAFT','COMPLETED');
create type public.review_decision as enum ('APPROVE','REJECT','REQUEST_CORRECTION');
create type public.report_kind as enum ('SUBMITTED','FINAL');
create type public.artifact_state as enum ('PENDING','READY','FAILED');

create table public.laboratories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  address text not null,
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  laboratory_id uuid not null references public.laboratories(id),
  display_name text not null,
  role public.lab_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,laboratory_id)
);
create table public.parties (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null references public.laboratories(id),
  name text not null,
  address text not null,
  contact jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,laboratory_id)
);
create table public.instrument_models (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null references public.laboratories(id),
  manufacturer_id uuid not null,
  designation text not null,
  category text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,laboratory_id),
  foreign key (manufacturer_id,laboratory_id) references public.parties(id,laboratory_id)
);
create table public.instruments (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null references public.laboratories(id),
  model_id uuid not null,
  applicant_id uuid not null,
  sample_identifier text not null,
  serial_number text,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,laboratory_id),
  unique (laboratory_id,sample_identifier),
  foreign key (model_id,laboratory_id) references public.instrument_models(id,laboratory_id),
  foreign key (applicant_id,laboratory_id) references public.parties(id,laboratory_id)
);
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null references public.laboratories(id),
  instrument_id uuid not null,
  assigned_tester_id uuid not null,
  application_number text not null,
  state public.evaluation_state not null default 'DRAFT',
  row_version bigint not null default 0,
  current_specification_id uuid,
  current_plan_id uuid,
  current_submission_id uuid,
  overall_conformity text not null default 'NOT_DETERMINED'
    check (overall_conformity in ('NOT_DETERMINED','CONFORMS','DOES_NOT_CONFORM')),
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,laboratory_id),
  unique (laboratory_id,application_number),
  foreign key (instrument_id,laboratory_id) references public.instruments(id,laboratory_id),
  foreign key (assigned_tester_id,laboratory_id) references public.profiles(id,laboratory_id)
);
create table public.specification_revisions (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null,
  evaluation_id uuid not null,
  version_no integer not null check (version_no > 0),
  accuracy_class text not null check (accuracy_class in ('I','II','III','IIII')),
  max_g numeric not null check (max_g > 0),
  min_g numeric not null check (min_g >= 0 and min_g <= max_g),
  e_g numeric not null check (e_g > 0),
  d_g numeric not null check (d_g > 0),
  features jsonb not null,
  recorded_by uuid not null,
  created_at timestamptz not null default now(),
  unique (id,evaluation_id,laboratory_id),
  unique (evaluation_id,version_no),
  foreign key (evaluation_id,laboratory_id) references public.evaluations(id,laboratory_id),
  foreign key (recorded_by,laboratory_id) references public.profiles(id,laboratory_id)
);
create table public.standard_documents (
  id text primary key,
  title text not null,
  edition text not null,
  local_reference_path text not null,
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  page_count integer not null check (page_count > 0),
  authority_level text not null check (authority_level in ('PRIMARY','SECONDARY')),
  created_at timestamptz not null default now()
);
create table public.rule_sets (
  id text primary key,
  version text not null unique,
  manifest jsonb not null,
  manifest_sha256 text not null check (manifest_sha256 ~ '^[a-f0-9]{64}$'),
  release_status text not null check (release_status in ('DRAFT','REVIEWED')),
  created_at timestamptz not null default now()
);
create table public.test_definitions (
  id text primary key,
  rule_set_id text not null references public.rule_sets(id),
  code text not null,
  version text not null,
  name text not null,
  implementation_status text not null check
    (implementation_status in ('NOT_IMPLEMENTED','UNVERIFIED','IMPLEMENTED')),
  input_schema jsonb not null,
  references_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (rule_set_id,code,version),
  unique (id,rule_set_id)
);
create table public.test_plans (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null,
  evaluation_id uuid not null,
  specification_id uuid not null,
  rule_set_id text not null references public.rule_sets(id),
  version_no integer not null check (version_no > 0),
  scope text not null check (scope in ('DEMO_SELECTED_ONLY','FULL_EVALUATION')),
  plan_snapshot jsonb not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (id,evaluation_id,laboratory_id),
  unique (id,rule_set_id),
  unique (evaluation_id,version_no),
  foreign key (evaluation_id,laboratory_id) references public.evaluations(id,laboratory_id),
  foreign key (specification_id,evaluation_id,laboratory_id)
    references public.specification_revisions(id,evaluation_id,laboratory_id),
  foreign key (created_by,laboratory_id) references public.profiles(id,laboratory_id)
);
create table public.test_plan_items (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null,
  evaluation_id uuid not null,
  plan_id uuid not null,
  definition_id text not null,
  rule_set_id text not null,
  position integer not null check (position > 0),
  coverage public.coverage_state not null,
  coverage_reason text not null,
  configuration jsonb not null,
  created_at timestamptz not null default now(),
  unique (id,evaluation_id,laboratory_id),
  unique (plan_id,position),
  unique (plan_id,definition_id),
  foreign key (plan_id,evaluation_id,laboratory_id) references public.test_plans(id,evaluation_id,laboratory_id),
  foreign key (plan_id,rule_set_id) references public.test_plans(id,rule_set_id),
  foreign key (definition_id,rule_set_id) references public.test_definitions(id,rule_set_id)
);
create table public.test_equipment (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null references public.laboratories(id),
  name text not null,
  type text not null,
  reference_number text not null,
  traceability_details jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,laboratory_id),
  unique (laboratory_id,reference_number)
);
create table public.test_sessions (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null,
  evaluation_id uuid not null,
  plan_item_id uuid not null,
  attempt_no integer not null check (attempt_no > 0),
  state public.session_state not null default 'DRAFT',
  row_version bigint not null default 0,
  observation_schema_version text not null,
  conditions jsonb not null,
  equipment_snapshot jsonb not null,
  procedure_confirmations jsonb not null,
  performed_at timestamptz not null,
  observer_id uuid not null,
  remarks text,
  retest_reason text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,evaluation_id,laboratory_id),
  unique (plan_item_id,attempt_no),
  foreign key (plan_item_id,evaluation_id,laboratory_id)
    references public.test_plan_items(id,evaluation_id,laboratory_id),
  foreign key (observer_id,laboratory_id) references public.profiles(id,laboratory_id),
  check (attempt_no = 1 or nullif(btrim(retest_reason),'') is not null),
  check ((state = 'COMPLETED') = (completed_at is not null))
);
create table public.test_observations (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null,
  evaluation_id uuid not null,
  session_id uuid not null,
  row_key text not null,
  sequence_no integer not null check (sequence_no > 0),
  row_version bigint not null default 0,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id,row_key),
  unique (session_id,sequence_no),
  foreign key (session_id,evaluation_id,laboratory_id)
    references public.test_sessions(id,evaluation_id,laboratory_id)
);
create table public.test_results (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null,
  evaluation_id uuid not null,
  session_id uuid not null,
  session_version bigint not null,
  rule_set_id text not null references public.rule_sets(id),
  engine_version text not null,
  input_sha256 text not null check (input_sha256 ~ '^[a-f0-9]{64}$'),
  outcome public.result_outcome not null,
  evaluation_json jsonb not null,
  evaluated_at timestamptz not null default now(),
  unique (session_id,session_version,engine_version),
  foreign key (session_id,evaluation_id,laboratory_id)
    references public.test_sessions(id,evaluation_id,laboratory_id)
);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null,
  evaluation_id uuid not null unique,
  report_number text not null,
  created_at timestamptz not null default now(),
  unique (id,evaluation_id,laboratory_id),
  unique (laboratory_id,report_number),
  foreign key (evaluation_id,laboratory_id) references public.evaluations(id,laboratory_id)
);
create table public.report_versions (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null,
  evaluation_id uuid not null,
  report_id uuid not null,
  version_no integer not null check (version_no > 0),
  kind public.report_kind not null,
  snapshot_schema_version text not null,
  snapshot jsonb not null,
  snapshot_sha256 text not null check (snapshot_sha256 ~ '^[a-f0-9]{64}$'),
  rule_set_id text not null references public.rule_sets(id),
  derived_from_id uuid,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (id,evaluation_id,laboratory_id),
  unique (report_id,version_no),
  foreign key (report_id,evaluation_id,laboratory_id) references public.reports(id,evaluation_id,laboratory_id),
  foreign key (derived_from_id,evaluation_id,laboratory_id)
    references public.report_versions(id,evaluation_id,laboratory_id),
  foreign key (created_by,laboratory_id) references public.profiles(id,laboratory_id),
  check (kind <> 'FINAL' or derived_from_id is not null)
);
create table public.approval_events (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null,
  evaluation_id uuid not null,
  submission_version_id uuid not null,
  decision public.review_decision not null,
  comment text,
  actor_id uuid not null,
  created_at timestamptz not null default now(),
  unique (submission_version_id),
  foreign key (submission_version_id,evaluation_id,laboratory_id)
    references public.report_versions(id,evaluation_id,laboratory_id),
  foreign key (actor_id,laboratory_id) references public.profiles(id,laboratory_id),
  check (decision = 'APPROVE' or nullif(btrim(comment),'') is not null)
);
create table public.report_artifacts (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null,
  evaluation_id uuid not null,
  report_version_id uuid not null,
  format text not null check (format in ('PDF','DOCX')),
  state public.artifact_state not null default 'PENDING',
  storage_path text not null unique,
  sha256 text check (sha256 ~ '^[a-f0-9]{64}$'),
  byte_length bigint check (byte_length > 0),
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_version_id,format),
  foreign key (report_version_id,evaluation_id,laboratory_id)
    references public.report_versions(id,evaluation_id,laboratory_id),
  check (state <> 'READY' or (sha256 is not null and byte_length is not null))
);
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null,
  evaluation_id uuid not null,
  session_id uuid,
  storage_path text not null unique,
  original_name text not null,
  media_type text not null check (media_type in ('application/pdf','image/png','image/jpeg')),
  state public.artifact_state not null default 'PENDING',
  sha256 text check (sha256 ~ '^[a-f0-9]{64}$'),
  byte_length bigint check (byte_length > 0),
  uploaded_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (evaluation_id,laboratory_id) references public.evaluations(id,laboratory_id),
  foreign key (session_id,evaluation_id,laboratory_id)
    references public.test_sessions(id,evaluation_id,laboratory_id),
  foreign key (uploaded_by,laboratory_id) references public.profiles(id,laboratory_id),
  check (state <> 'READY' or (sha256 is not null and byte_length is not null))
);
create table public.audit_logs (
  id bigint generated always as identity primary key,
  laboratory_id uuid not null references public.laboratories(id),
  evaluation_id uuid,
  actor_id uuid,
  actor_kind text not null check (actor_kind in ('USER','SYSTEM')),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (evaluation_id,laboratory_id) references public.evaluations(id,laboratory_id),
  foreign key (actor_id,laboratory_id) references public.profiles(id,laboratory_id),
  check ((actor_kind = 'USER') = (actor_id is not null))
);

alter table public.evaluations add foreign key (current_specification_id,id,laboratory_id)
  references public.specification_revisions(id,evaluation_id,laboratory_id);
alter table public.evaluations add foreign key (current_plan_id,id,laboratory_id)
  references public.test_plans(id,evaluation_id,laboratory_id);
alter table public.evaluations add foreign key (current_submission_id,id,laboratory_id)
  references public.report_versions(id,evaluation_id,laboratory_id);

-- Scoped list/detail/queue and foreign-key lookup indexes.
create index evaluations_queue on public.evaluations(laboratory_id,state,updated_at desc);
create index evaluations_assigned on public.evaluations(assigned_tester_id,state);
create index evaluations_instrument on public.evaluations(instrument_id);
create index instrument_model_lookup on public.instruments(model_id);
create index instruments_applicant on public.instruments(applicant_id);
create index model_manufacturer on public.instrument_models(manufacturer_id);
create index sessions_evaluation on public.test_sessions(evaluation_id,state);
create index observations_session on public.test_observations(session_id,sequence_no);
create index results_evaluation on public.test_results(evaluation_id,outcome);
create index artifacts_evaluation on public.report_artifacts(evaluation_id,state);
create index attachments_evaluation on public.attachments(evaluation_id,session_id);
create index approvals_queue on public.approval_events(laboratory_id,created_at desc);
create index audit_evaluation on public.audit_logs(evaluation_id,created_at,id);
create index audit_lab on public.audit_logs(laboratory_id,created_at desc,id);
commit;
