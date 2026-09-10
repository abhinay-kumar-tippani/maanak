-- SIH26035 NAWI Lab demo bootstrap template.
--
-- Create two distinct Auth users first, then replace the named UUID literals
-- below with the laboratory UUID and those Auth user UUIDs. This file contains
-- no passwords, API keys, service keys, or real credentials.
--
-- PLACEHOLDER_LABORATORY_UUID: fictional laboratory identity
-- PLACEHOLDER_TESTER_USER_UUID: existing auth.users row for the TESTER
-- PLACEHOLDER_APPROVER_USER_UUID: existing auth.users row for the APPROVER

begin;

with ids as (
  select
    '47ef74c8-8ea1-4f7b-9cf9-3eaedaae2246'::uuid as laboratory_id,
    '7d6caf1d-a849-40c5-9eba-79c37c4e6cd9'::uuid as tester_id,
    '04788d47-8fde-45b9-ac36-3d38a0650505'::uuid as approver_id
)
insert into public.laboratories (id, code, name, address, is_demo)
select laboratory_id, 'SIH26035-DEMO', 'NAWI Lab Demonstration Laboratory',
       'Fictional demonstration address', true
from ids;

with ids as (
  select
    '47ef74c8-8ea1-4f7b-9cf9-3eaedaae2246'::uuid as laboratory_id,
    '7d6caf1d-a849-40c5-9eba-79c37c4e6cd9'::uuid as tester_id,
    '04788d47-8fde-45b9-ac36-3d38a0650505'::uuid as approver_id
)
insert into public.profiles (id, laboratory_id, display_name, role, active)
select tester_id, laboratory_id, 'Demo Tester', 'TESTER'::public.lab_role, true
from ids
union all
select approver_id, laboratory_id, 'Demo Approver', 'APPROVER'::public.lab_role, true
from ids;

commit;
