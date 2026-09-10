# Database data dictionary

Generated from the supplied SQL foundation. Defaults, uniqueness, foreign keys and types are executable in the migration, which is authoritative. No live database execution has been performed here. Decimal mass values use PostgreSQL numeric without forced rounding. JSONB observations are validated against versioned TypeScript/Zod schemas before command persistence.

## laboratories

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `code` | `text not null unique` | No |
| `name` | `text not null` | No |
| `address` | `text not null` | No |
| `is_demo` | `boolean not null default true` | No |
| `created_at` | `timestamptz not null default now()` | No |
| `updated_at` | `timestamptz not null default now()` | No |

Additional constraints: See inline definitions.

## profiles

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key references auth.users(id) on delete restrict` | No |
| `laboratory_id` | `uuid not null references public.laboratories(id)` | No |
| `display_name` | `text not null` | No |
| `role` | `public.lab_role not null` | No |
| `active` | `boolean not null default true` | No |
| `created_at` | `timestamptz not null default now()` | No |
| `updated_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (id,laboratory_id)`

## parties

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null references public.laboratories(id)` | No |
| `name` | `text not null` | No |
| `address` | `text not null` | No |
| `contact` | `jsonb not null default '{}'::jsonb` | No |
| `created_at` | `timestamptz not null default now()` | No |
| `updated_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (id,laboratory_id)`

## instrument_models

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null references public.laboratories(id)` | No |
| `manufacturer_id` | `uuid not null` | No |
| `designation` | `text not null` | No |
| `category` | `text not null` | No |
| `description` | `text` | Yes |
| `created_at` | `timestamptz not null default now()` | No |
| `updated_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (id,laboratory_id)`; `foreign key (manufacturer_id,laboratory_id) references public.parties(id,laboratory_id)`

## instruments

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null references public.laboratories(id)` | No |
| `model_id` | `uuid not null` | No |
| `applicant_id` | `uuid not null` | No |
| `sample_identifier` | `text not null` | No |
| `serial_number` | `text` | Yes |
| `received_at` | `timestamptz not null default now()` | No |
| `created_at` | `timestamptz not null default now()` | No |
| `updated_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (id,laboratory_id)`; `unique (laboratory_id,sample_identifier)`; `foreign key (model_id,laboratory_id) references public.instrument_models(id,laboratory_id)`; `foreign key (applicant_id,laboratory_id) references public.parties(id,laboratory_id)`

## evaluations

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null references public.laboratories(id)` | No |
| `instrument_id` | `uuid not null` | No |
| `assigned_tester_id` | `uuid not null` | No |
| `application_number` | `text not null` | No |
| `state` | `public.evaluation_state not null default 'DRAFT'` | No |
| `row_version` | `bigint not null default 0` | No |
| `current_specification_id` | `uuid` | Yes |
| `current_plan_id` | `uuid` | Yes |
| `current_submission_id` | `uuid` | Yes |
| `overall_conformity` | `text not null default 'NOT_DETERMINED' check (overall_conformity in ('NOT_DETERMINED','CONFORMS','DOES_NOT_CONFORM'))` | No |
| `is_demo` | `boolean not null default true` | No |
| `created_at` | `timestamptz not null default now()` | No |
| `updated_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (id,laboratory_id)`; `unique (laboratory_id,application_number)`; `foreign key (instrument_id,laboratory_id) references public.instruments(id,laboratory_id)`; `foreign key (assigned_tester_id,laboratory_id) references public.profiles(id,laboratory_id)`

## specification_revisions

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null` | No |
| `evaluation_id` | `uuid not null` | No |
| `version_no` | `integer not null check (version_no > 0)` | No |
| `accuracy_class` | `text not null check (accuracy_class in ('I','II','III','IIII'))` | No |
| `max_g` | `numeric not null check (max_g > 0)` | No |
| `min_g` | `numeric not null check (min_g >= 0 and min_g <= max_g)` | No |
| `e_g` | `numeric not null check (e_g > 0)` | No |
| `d_g` | `numeric not null check (d_g > 0)` | No |
| `features` | `jsonb not null` | No |
| `recorded_by` | `uuid not null` | No |
| `created_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (id,evaluation_id,laboratory_id)`; `unique (evaluation_id,version_no)`; `foreign key (evaluation_id,laboratory_id) references public.evaluations(id,laboratory_id)`; `foreign key (recorded_by,laboratory_id) references public.profiles(id,laboratory_id)`

## standard_documents

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `text primary key` | No |
| `title` | `text not null` | No |
| `edition` | `text not null` | No |
| `local_reference_path` | `text not null` | No |
| `sha256` | `text not null check (sha256 ~ '^[a-f0-9]{64}$')` | No |
| `page_count` | `integer not null check (page_count > 0)` | No |
| `authority_level` | `text not null check (authority_level in ('PRIMARY','SECONDARY'))` | No |
| `created_at` | `timestamptz not null default now()` | No |

Additional constraints: See inline definitions.

## rule_sets

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `text primary key` | No |
| `version` | `text not null unique` | No |
| `manifest` | `jsonb not null` | No |
| `manifest_sha256` | `text not null check (manifest_sha256 ~ '^[a-f0-9]{64}$')` | No |
| `release_status` | `text not null check (release_status in ('DRAFT','REVIEWED'))` | No |
| `created_at` | `timestamptz not null default now()` | No |

Additional constraints: See inline definitions.

## test_definitions

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `text primary key` | No |
| `rule_set_id` | `text not null references public.rule_sets(id)` | No |
| `code` | `text not null` | No |
| `version` | `text not null` | No |
| `name` | `text not null` | No |
| `implementation_status` | `text not null check (implementation_status in ('NOT_IMPLEMENTED','UNVERIFIED','IMPLEMENTED'))` | No |
| `input_schema` | `jsonb not null` | No |
| `references_json` | `jsonb not null` | No |
| `created_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (rule_set_id,code,version)`; `unique (id,rule_set_id)`

## test_plans

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null` | No |
| `evaluation_id` | `uuid not null` | No |
| `specification_id` | `uuid not null` | No |
| `rule_set_id` | `text not null references public.rule_sets(id)` | No |
| `version_no` | `integer not null check (version_no > 0)` | No |
| `scope` | `text not null check (scope in ('DEMO_SELECTED_ONLY','FULL_EVALUATION'))` | No |
| `plan_snapshot` | `jsonb not null` | No |
| `created_by` | `uuid not null` | No |
| `created_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (id,evaluation_id,laboratory_id)`; `unique (id,rule_set_id)`; `unique (evaluation_id,version_no)`; `foreign key (evaluation_id,laboratory_id) references public.evaluations(id,laboratory_id)`; `foreign key (specification_id,evaluation_id,laboratory_id) references public.specification_revisions(id,evaluation_id,laboratory_id)`; `foreign key (created_by,laboratory_id) references public.profiles(id,laboratory_id)`

## test_plan_items

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null` | No |
| `evaluation_id` | `uuid not null` | No |
| `plan_id` | `uuid not null` | No |
| `definition_id` | `text not null` | No |
| `rule_set_id` | `text not null` | No |
| `position` | `integer not null check (position > 0)` | No |
| `coverage` | `public.coverage_state not null` | No |
| `coverage_reason` | `text not null` | No |
| `configuration` | `jsonb not null` | No |
| `created_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (id,evaluation_id,laboratory_id)`; `unique (plan_id,position)`; `unique (plan_id,definition_id)`; `foreign key (plan_id,evaluation_id,laboratory_id) references public.test_plans(id,evaluation_id,laboratory_id)`; `foreign key (plan_id,rule_set_id) references public.test_plans(id,rule_set_id)`; `foreign key (definition_id,rule_set_id) references public.test_definitions(id,rule_set_id)`

## test_equipment

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null references public.laboratories(id)` | No |
| `name` | `text not null` | No |
| `type` | `text not null` | No |
| `reference_number` | `text not null` | No |
| `traceability_details` | `jsonb not null` | No |
| `created_at` | `timestamptz not null default now()` | No |
| `updated_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (id,laboratory_id)`; `unique (laboratory_id,reference_number)`

## test_sessions

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null` | No |
| `evaluation_id` | `uuid not null` | No |
| `plan_item_id` | `uuid not null` | No |
| `attempt_no` | `integer not null check (attempt_no > 0)` | No |
| `state` | `public.session_state not null default 'DRAFT'` | No |
| `row_version` | `bigint not null default 0` | No |
| `observation_schema_version` | `text not null` | No |
| `conditions` | `jsonb not null` | No |
| `equipment_snapshot` | `jsonb not null` | No |
| `procedure_confirmations` | `jsonb not null` | No |
| `performed_at` | `timestamptz not null` | No |
| `observer_id` | `uuid not null` | No |
| `remarks` | `text` | Yes |
| `retest_reason` | `text` | Yes |
| `completed_at` | `timestamptz` | Yes |
| `created_at` | `timestamptz not null default now()` | No |
| `updated_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (id,evaluation_id,laboratory_id)`; `unique (plan_item_id,attempt_no)`; `foreign key (plan_item_id,evaluation_id,laboratory_id) references public.test_plan_items(id,evaluation_id,laboratory_id)`; `foreign key (observer_id,laboratory_id) references public.profiles(id,laboratory_id)`; `check (attempt_no = 1 or nullif(btrim(retest_reason),'') is not null)`; `check ((state = 'COMPLETED') = (completed_at is not null))`

## test_observations

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null` | No |
| `evaluation_id` | `uuid not null` | No |
| `session_id` | `uuid not null` | No |
| `row_key` | `text not null` | No |
| `sequence_no` | `integer not null check (sequence_no > 0)` | No |
| `row_version` | `bigint not null default 0` | No |
| `payload` | `jsonb not null` | No |
| `created_at` | `timestamptz not null default now()` | No |
| `updated_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (session_id,row_key)`; `unique (session_id,sequence_no)`; `foreign key (session_id,evaluation_id,laboratory_id) references public.test_sessions(id,evaluation_id,laboratory_id)`

## test_results

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null` | No |
| `evaluation_id` | `uuid not null` | No |
| `session_id` | `uuid not null` | No |
| `session_version` | `bigint not null` | No |
| `rule_set_id` | `text not null references public.rule_sets(id)` | No |
| `engine_version` | `text not null` | No |
| `input_sha256` | `text not null check (input_sha256 ~ '^[a-f0-9]{64}$')` | No |
| `outcome` | `public.result_outcome not null` | No |
| `evaluation_json` | `jsonb not null` | No |
| `evaluated_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (session_id,session_version,engine_version)`; `foreign key (session_id,evaluation_id,laboratory_id) references public.test_sessions(id,evaluation_id,laboratory_id)`

## reports

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null` | No |
| `evaluation_id` | `uuid not null unique` | No |
| `report_number` | `text not null` | No |
| `created_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (id,evaluation_id,laboratory_id)`; `unique (laboratory_id,report_number)`; `foreign key (evaluation_id,laboratory_id) references public.evaluations(id,laboratory_id)`

## report_versions

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null` | No |
| `evaluation_id` | `uuid not null` | No |
| `report_id` | `uuid not null` | No |
| `version_no` | `integer not null check (version_no > 0)` | No |
| `kind` | `public.report_kind not null` | No |
| `snapshot_schema_version` | `text not null` | No |
| `snapshot` | `jsonb not null` | No |
| `snapshot_sha256` | `text not null check (snapshot_sha256 ~ '^[a-f0-9]{64}$')` | No |
| `rule_set_id` | `text not null references public.rule_sets(id)` | No |
| `derived_from_id` | `uuid` | Yes |
| `created_by` | `uuid not null` | No |
| `created_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (id,evaluation_id,laboratory_id)`; `unique (report_id,version_no)`; `foreign key (report_id,evaluation_id,laboratory_id) references public.reports(id,evaluation_id,laboratory_id)`; `foreign key (derived_from_id,evaluation_id,laboratory_id) references public.report_versions(id,evaluation_id,laboratory_id)`; `foreign key (created_by,laboratory_id) references public.profiles(id,laboratory_id)`; `check (kind <> 'FINAL' or derived_from_id is not null)`

## approval_events

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null` | No |
| `evaluation_id` | `uuid not null` | No |
| `submission_version_id` | `uuid not null` | No |
| `decision` | `public.review_decision not null` | No |
| `comment` | `text` | Yes |
| `actor_id` | `uuid not null` | No |
| `created_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (submission_version_id)`; `foreign key (submission_version_id,evaluation_id,laboratory_id) references public.report_versions(id,evaluation_id,laboratory_id)`; `foreign key (actor_id,laboratory_id) references public.profiles(id,laboratory_id)`; `check (decision = 'APPROVE' or nullif(btrim(comment),'') is not null)`

## report_artifacts

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null` | No |
| `evaluation_id` | `uuid not null` | No |
| `report_version_id` | `uuid not null` | No |
| `format` | `text not null check (format in ('PDF','DOCX'))` | No |
| `state` | `public.artifact_state not null default 'PENDING'` | No |
| `storage_path` | `text not null unique` | No |
| `sha256` | `text check (sha256 ~ '^[a-f0-9]{64}$')` | Yes |
| `byte_length` | `bigint check (byte_length > 0)` | Yes |
| `last_error_code` | `text` | Yes |
| `created_at` | `timestamptz not null default now()` | No |
| `updated_at` | `timestamptz not null default now()` | No |

Additional constraints: `unique (report_version_id,format)`; `foreign key (report_version_id,evaluation_id,laboratory_id) references public.report_versions(id,evaluation_id,laboratory_id)`; `check (state <> 'READY' or (sha256 is not null and byte_length is not null))`

## attachments

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | No |
| `laboratory_id` | `uuid not null` | No |
| `evaluation_id` | `uuid not null` | No |
| `session_id` | `uuid` | Yes |
| `storage_path` | `text not null unique` | No |
| `original_name` | `text not null` | No |
| `media_type` | `text not null check (media_type in ('application/pdf','image/png','image/jpeg'))` | No |
| `state` | `public.artifact_state not null default 'PENDING'` | No |
| `sha256` | `text check (sha256 ~ '^[a-f0-9]{64}$')` | Yes |
| `byte_length` | `bigint check (byte_length > 0)` | Yes |
| `uploaded_by` | `uuid not null` | No |
| `created_at` | `timestamptz not null default now()` | No |
| `updated_at` | `timestamptz not null default now()` | No |

Additional constraints: `foreign key (evaluation_id,laboratory_id) references public.evaluations(id,laboratory_id)`; `foreign key (session_id,evaluation_id,laboratory_id) references public.test_sessions(id,evaluation_id,laboratory_id)`; `foreign key (uploaded_by,laboratory_id) references public.profiles(id,laboratory_id)`; `check (state <> 'READY' or (sha256 is not null and byte_length is not null))`

## audit_logs

| Column | Definition / datatype / constraint | Nullable |
|---|---|---|
| `id` | `bigint generated always as identity primary key` | No |
| `laboratory_id` | `uuid not null references public.laboratories(id)` | No |
| `evaluation_id` | `uuid` | Yes |
| `actor_id` | `uuid` | Yes |
| `actor_kind` | `text not null check (actor_kind in ('USER','SYSTEM'))` | No |
| `action` | `text not null` | No |
| `entity_type` | `text not null` | No |
| `entity_id` | `text not null` | No |
| `old_value` | `jsonb` | Yes |
| `new_value` | `jsonb` | Yes |
| `metadata` | `jsonb not null default '{}'::jsonb` | No |
| `created_at` | `timestamptz not null default now()` | No |

Additional constraints: `foreign key (evaluation_id,laboratory_id) references public.evaluations(id,laboratory_id)`; `foreign key (actor_id,laboratory_id) references public.profiles(id,laboratory_id)`; `check ((actor_kind = 'USER') = (actor_id is not null))`

## Indexes

```sql
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
```

The three current-pointer composite foreign keys are declared at the end of migration 001. Migration 002 contains read grants, RLS, immutability and audit triggers. The application command/transition layer must be completed during the runbook.