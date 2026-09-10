# Security and transaction contract

This is a prototype architecture, not a statement of accreditation or Indian legal compliance. The migrations provide schema, read policies, several immutability guards, and transactional change auditing. They do NOT yet implement command RPCs, the full state-transition guard, authentication, or a runnable application. These must be implemented and tested at the stages listed in the runbook. No live Supabase migration or integration test has been run in this conversation.

## Roles

One laboratory per profile is a deliberate P0 simplification. TESTER edits assigned evaluations; APPROVER reads their laboratory's evaluations and decides on submitted report snapshots; ADMIN manages laboratory configuration and accounts. ADMIN is not an approver. No applicant account in P0. Create real tester and approver Auth users with distinct UUIDs. Do not put roles in editable user metadata, query parameters, localStorage, or a role-switch button.

## Data path

1. The browser submits raw input and an expected version to a Next.js Server Action or POST handler.
2. The server validates the user with Supabase getUser() for mutations, resolves their active profile and assignment, and validates the input with Zod.
3. Reads use the caller's cookie-scoped client so RLS applies. Every user-specific route remains dynamic; do not put authenticated responses in a shared cache.
4. Sensitive writes use a narrowly named PostgreSQL command RPC with a server-only service client. Each RPC is SECURITY DEFINER with an empty search_path, fully qualified names, and EXECUTE granted only to service_role. Revoke EXECUTE from PUBLIC, anon, and authenticated immediately in the same migration.
5. Only the server chooses p_actor_id from the verified user. The caller cannot choose actor, role, lab, verdict, tolerance, rule version, or approval snapshot. The database rechecks actor's active profile, role, lab, assignment, expected state and version. The RPC sets set_config('app.actor_id', p_actor_id::text, true) ONLY after those checks. This is LOCAL transaction state.
6. Every evaluation mutation locks the evaluation row first (FOR UPDATE), then session rows in stable ID order. Increment evaluation row_version on every change; increment session row_version when its input changes. This same lock order applies to raw edits, submit, review, and artifact issuance.
7. Engine calculation is outside the database transaction. Compute from a saved, versioned input snapshot. The persist RPC must compare the version and input hash again under lock. If any observation, specification, conditions, equipment, plan or rule-set dependency changed, reject with STALE_DATA and recalculate. Never persist an evaluation against unchecked old inputs.
8. Commit data plus audit events in the same database transaction. Do not run several independent .insert() calls and call them a transaction.

## Required command RPCs, added in their feature stages

| RPC | Required role and conditions | Work in its one transaction |
|---|---|---|
| command_register_instrument | TESTER, active lab | Parties/model/sample/evaluation creation; registration audit; initial version |
| command_save_specification | Assigned TESTER; DRAFT or reopened correction | Append specification revision; clear current plan and invalidate active results; preserve historical plans; audit |
| command_create_plan | Assigned TESTER; valid scoped specifications | Insert immutable plan and coverage items; set current plan; transition to PLANNED |
| command_save_observations | Assigned TESTER; active plan, TESTING, DRAFT attempt | Validate observations; save rows; bump versions; retain old rows in audit; old results remain immutable but stale |
| command_start_retest | Assigned TESTER; allowed editing state | New attempt_no with nonempty reason; preserve completed attempt and its result; mark active attempt in service-selected current plan state |
| command_record_result | Assigned TESTER; version/hash still current | Insert engine result; domain outcome can be PASS/FAIL/INCOMPLETE etc.; audit calculation |
| command_complete_test | Assigned TESTER; valid data and current PASS or FAIL result | Lock attempt; completed_at; audit. FAIL is a completed test outcome, not missing data |
| command_mark_ready | Assigned TESTER; all three selected test items completed and current | Set READY_FOR_REVIEW; keep overall_conformity NOT_DETERMINED for demo coverage |
| command_submit | Assigned TESTER; READY_FOR_REVIEW, no pending evidence | Freeze full ReportSnapshot and hash; allocate report version with row lock; set current_submission_id; UNDER_REVIEW; audit |
| command_review | APPROVER; same lab; not assigned tester; UNDER_REVIEW | Decide on exact current submitted version/hash; require comment for reject/correction and approval of a report with FAIL; unique decision per submitted version; append approval event; transition |
| command_prepare_final | APPROVER; same lab; APPROVED | Copy approved submission data, attach approval; freeze new FINAL version and stable generatedAt; reserve one PDF artifact; do NOT mark ISSUED |
| command_finish_artifact | Same authorized approver; correct reservation and state | Only after successful private upload; persist actual byte digest and size; READY; ISSUED; audit |
| command_fail_artifact | Same authorized actor | Record safe failure code; remain APPROVED; keep reservation so retry doesn't issue duplicates |
| command_reserve_attachment / command_finish_attachment | Assigned TESTER; editable attempt and evaluation | Validate membership, size/MIME, reserve immutable path; verify bytes/hash; READY only when upload finished |
| command_archive | ADMIN; same lab; ISSUED or REJECTED | State-only transition and audit; no deletion of records or bytes |

Do not expose a generic CRUD RPC that accepts arbitrary table names or arbitrary SQL. Tables in the migrations have no authenticated INSERT/UPDATE/DELETE grants. It is intentional that raw Supabase browser CRUD fails until these server actions exist.

## State and history guard

Add a database BEFORE UPDATE guard for evaluations when implementing command transitions. Check the state graph in the blueprint, immutable evaluation identity and laboratory/assignment, and forbid changes to evidence/specification/plan/submission pointers after submission except the explicitly allowed new-submission operation. No direct edit from READY_FOR_REVIEW: reopen to TESTING first. Completed attempts never reopen; create a retest attempt with reason. Corrections to specifications create a new specification revision and invalidate the active plan and dependent results. Approval never mutates an observation or metrology result.

Reports, report versions, approval decisions, plan versions, rules, sources, specification revisions and calculated results are append-only. Raw draft observation updates are retained with old/new values in the audit. Ready artifact metadata is immutable. A future rule version does not recalculate old reports. No DELETE UI or client DELETE grant. Database owners and a compromised privileged server remain outside the protection provided by RLS; do not claim tamper-proof storage.

## Storage

- Private bucket nawi-evidence: `<labId>/<evaluationId>/<attachmentId>/<safeName>`.
- Private bucket nawi-reports: `<labId>/<evaluationId>/<reportVersionId>/<artifactId>.pdf`.
- Store paths, MIME, byte count, SHA-256 and original name in metadata. Never store expiring signed URLs as identity.
- P0 evidence limit: 2 MiB per file, PDF/PNG/JPEG only. This is our software limit, not OIML. Use a POST Route Handler; do not base64 encode in a Server Action. Enforce streamed byte limits and content validation on the server. Supply authenticated signed download URLs only after read authorization, with a short app-selected lifetime (e.g. 60 seconds).
- Only the server uploads with upsert:false to a reserved unique path. No user overwrite/delete policies. An attachment is not reportable until READY. A report is not ISSUED until PDF upload and metadata commit succeed.
- P1 large uploads need a signed direct-upload reservation that cannot be attached after submission; handle the race of an outstanding signed upload against submission. Do not issue a URL then accept arbitrary caller-supplied paths.
- A QR code in P1 links to a random verification token exposing only report number, digest and issued status. It must not expose manufacturer evidence, addresses, login cookies or a long-lived public PDF URL.

## Error envelope

Return ActionResult<T> from src/contracts/domain.ts. Translate permission failures, stale versions, incomplete observations, unsupported profiles, missing rules, locked attempts and PDF failures into useful messages. Log internal request ID and server detail privately; never show raw SQL, stack traces, keys or tokens in the UI.

## Required negative checks

Use real Auth sessions and the publishable key (NOT service_role) to prove: tester cannot edit profile role; tester cannot call review RPC; approver cannot edit observations; unrelated lab user cannot SELECT target records or download evidence; unauthenticated user gets no data; completed attempts cannot mutate; stale tab save is rejected; simultaneous reviews produce one decision; an outdated submission cannot be approved; a PDF failure leaves APPROVED with retry; application audit cannot be edited or deleted. Verify both table grants and RLS, not just hidden UI buttons.
