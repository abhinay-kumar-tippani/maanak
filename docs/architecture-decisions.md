# Architecture decisions

## 1. Shared contracts are client-safe

`src/contracts` contains wire DTOs and shared TypeScript types only. `ActionResult<T>` is the common result envelope for server actions and handlers: success carries `data` and a `version`; failure carries a stable error code/message and optional field errors. Contracts do not import server-only modules or perform runtime metrology work.

## 2. Pure domain logic is isolated

`src/domain/oiml` owns independently testable validation, plans, calculations, and evaluations. It receives explicit typed inputs and context and returns structured traces/issues. It has no database, request, credential, or framework dependency.

## 3. Server services own trust boundaries

`src/server` owns authentication checks, authorization, persistence, workflow/state transitions, audit history, and report snapshot/generation/storage orchestration. The server derives actor and scope from verified identity and persists only server-calculated outcomes after version/hash rechecks.

## 4. UI cannot cross privileged boundaries

UI modules may consume client-safe contracts and display metadata. They must never import runtime metrology calculators, server-only services, privileged Supabase clients, service keys, or database command implementations. Route visibility is not authorization.

## 5. Decimal strings cross boundaries

Metrology quantities use decimal strings with explicit units at browser, DTO, server, persistence, and report boundaries. Domain code may construct Decimal values for arithmetic, but binary floating-point values and display-formatted strings are not authoritative inputs.

## 6. P0 scope is deliberately narrow

The supported demonstration is a complete digital Class III single-interval ordinary platform instrument without auxiliary indication, `e = d`, `e >= 5 g`, `Max < 1000 kg`, at most four support points, no additive tare, and no extended-resolution mode. The fictional DEMO-30 profile is Max 30 kg, Min 200 g, `e = d = 10 g`, `n = 3000`, one support point. P0 selects three tests: initial intrinsic error, eccentricity using weights, and type-evaluation repeatability. Unsupported profiles are `NOT_SUPPORTED`; selected-test completion does not establish overall conformity.

## 7. Verification is separate from implementation

Source verification status, implementation status, test status, coverage, outcome, and workflow state remain separate concepts. The current source pack is `SPECIFICATION_ONLY` until reviewed implementation and golden tests exist. Partial selected coverage is reported explicitly and overall conformity remains `NOT_DETERMINED`. No missing test is silently changed to `NOT_APPLICABLE`, and no unverified source authorizes a verdict.

## 8. Contract consistency review

The current `src/contracts/domain.ts` is consistent with these boundaries: it defines decimal-string quantities, source references, scoped outcomes/coverage, server-controlled `EvaluateTestInput`, immutable evaluation/report context, and `ActionResult<T>`. No concrete inconsistency requiring a consumer change was found. These documents do not alter the contract.

## 9. STEP 12: source-grounded selected-demo planning

This stage implements planning and structural observation schemas only. Source verification, plan generation, evaluator implementation and physical test execution are distinct. The new rule set `r76-2006-2007-demo-classiii-plan-v1`, version `selected-demo-plan-1`, is DRAFT; all three evaluator identifiers remain NOT_IMPLEMENTED. The supplied registry and its original version are unchanged. The derived manifest includes the original registry, source/catalogue file hashes, definition metadata, complete coverage and planning policy. Its SHA-256 is over the exact UTF-8 JSON text embedded between the migration's `$manifest$` delimiters, before PostgreSQL JSONB normalization.

The supplied PDFs were extracted and relevant table/procedure pages visually inspected. Both PDF hashes match `source-manifest.json`. Printed and PDF page numbers coincide for these references:

| Planning requirement | Verified source | Implementation interpretation |
|---|---|---|
| Declared class branch, e/d relation | R76-1 (2006), Tables 2/3, pp26-27 | e=d, e>=5 g, 500<=Max/e<=10000, Min>=20e; declared consistency only |
| Interval form | R76-1 4.2.2.1, p43 | d has 1/2/5 times power-of-ten form; no inferred class |
| Weighing change points | R76-1 Table 6, p30 | Use 500e and 2000e for load selection; no error tolerances or verdicts calculated |
| Initial weighing | R76-1 A.4.4.1-A.4.4.2, p88; R76-2 (2007) Form 1, p10 | Progressive zero/Max/zero, >=10 distinct loads, Min where >=100 mg, change-point coverage; supplementary >20% initial-zero range excluded |
| Changeover and zero evidence | R76-1 A.4.2.3.2, A.4.4.3, pp88-89; R76-2 pp5,10 | Require actual indication/additional-load observations and separate zero/near-zero references; no inferred readings |
| Eccentric load | R76-1 3.6.2.1, p31 | (Max + additive tare)/3 only for scoped ordinary receptor; P0 additive tare explicitly zero |
| Eccentric positions/devices | R76-1 A.4.7/A.4.7.1, pp90-91; R76-2 Form 3.1, p12 | Four quarters irrespective of 1-4 supports; numbered sketch/display; zero before each segment per form; zero devices not operating |
| Type-evaluation repeatability | R76-1 A.4.10, p93; R76-2 Form 5, p16 | Two series about half/near full Max; ten each when Max<1000 kg, actual resting unloaded readings and reset-on-deviation; devices operating if present |
| Manual intake/conditions/equipment | R76-1 A.1-A.3/A.4.1, pp85-86; 3.7.1 p32; R76-2 p8 | Record manual confirmations and evidence; steady-temperature criteria stay manual. No auto-confirmation |
| Omitted families | R76-2 contents p2, summary p9, checklist notes p49; supplied catalogue page locators | Catalogue completeness does not verify every omitted procedure; NOT_IMPLEMENTED, never automatic NOT_APPLICABLE |

R76-1 SHA-256: `06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b`.
R76-2 SHA-256: `650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820`.
Full R111 validation and operational logic for omitted procedures remain **NOT VERIFIED FROM PROVIDED AUTHORITATIVE SOURCE**. No such logic is implemented.

The blueprint's general e-aligned-tenths policy and its explicit DEMO-30 list differ. To honor both supplied requirements, the exact numerical profile Max=30000 g, Min=200 g, e=d=10 g uses the documented 11-point list (200, 1000, 2500, 5000, 5010, 10000, 15000, 20000, 20010, 25000, 30000). All other profiles use Min/Max, reachable 500e/2000e and threshold+e, then ascending exact e-aligned tenths until ten positive loads. Exact points, ten *positive* loads in addition to zero, and the exact half/full repeatability choices are software decisions, not universal OIML mandates. No demo observations/results are imported by production planning code.

Off-grid optional tenths are skipped without rounding. If fewer than ten distinct permitted points remain, planning returns INSUFFICIENT_EXACT_LOADS. If the one-third eccentric load cannot be expressed as a finite decimal, planning returns ECCENTRIC_LOAD_NOT_EXACT. Both are unresolved planning conditions, not instrument FAIL. No alternative load spacing, approximation or weight-resolution tolerance is invented. Input decimal strings have a 60-character engineering bound and use a local Decimal clone with 200-digit precision; this is not an OIML limit.

Persisted numeric columns are explicitly selected as `::text`; feature flags are validated without Boolean coercion/defaults. Existing specification query interfaces are preserved. Their current fallback behavior is unsuitable for authoritative planning, so `normalizeSpecification` explicitly maps the raw revision into the existing `InstrumentSpecifications`. The supplied fixture omits some category/feature declarations: tests declare those explicitly from the P0 blueprint instead of treating absence as false.

`createTestPlan({evaluationId, expectedRowVersion})` in `src/server/actions/plans.ts` returns `ActionResult<SavedTestPlan>`. It calls auth.getUser(), confirms the same identity via existing requireActor(), checks assignment, reads the current revision under cookie/RLS scope, and generates the plan server-side. Only the named privileged command mutates the database. `getTestPlan(evaluationId)` in `src/server/plans/queries.ts` returns `ActionResult<SavedTestPlan|null>` for the current pointer; `version` is the evaluation row version. A missing plan is null, not a generated placeholder. v1 reads reject unknown/corrupt snapshot versions rather than reinterpreting historical plans under a new planner.

`command_create_plan(uuid,uuid,bigint,uuid,jsonb)` locks the evaluation, rechecks the active assigned tester/lab, expected version and current specification, pins reference metadata, and appends one plan plus three items. Only DRAFT with no current plan is allowed. Correction workflows first save a new specification revision to return to DRAFT; TESTING/PLANNED are never reset by planning. The command sets transaction-local actor context, updates DRAFT->PLANNED and row_version once, and writes plan.created atomically. Duplicate/replayed requests are rejected as stale/locked rather than adding plans. Historical plans, attempts, results and report snapshots are untouched. The service-generated plan is a trusted server payload; no browser-facing plan/coverage/rule-set input is accepted.

Reference installation inserts two standard documents, one new DRAFT rule set and three NOT_IMPLEMENTED evaluator definitions. Existing records are compared exactly and REFERENCE_VERSION_CONFLICT aborts on differences; no immutable rows are updated. Repository migrations contained no earlier reference seeds. No live backend was accessed, so existing live reference rows and persistence/RLS/concurrency tests remain pending.

Migration order is 001 foundation, 002 security, 003 command guards, 004 registration, 005 specifications, existing `202609090006_registration_ambiguity_fix.sql`, then `202609090007_plans.sql`. The unapplied plan migration was assigned the unique 007 version so automatic migration tooling does not encounter a duplicate version prefix. Confirm the remote history before applying it because remote migration status was unavailable from this workstation.

Planning tests use the installed TypeScript compiler and node:test, with isolated CommonJS output under `.next/plan-tests`. `npm.cmd run test:plan` propagates compilation and test failure. Tests exercise actual planning modules and independent fixture/source expectations; these do not establish live command or security integration correctness.
## 2026-09-10 — Selected-test evaluation and report issue

- The published Step 12 plan snapshot and its `NOT_IMPLEMENTED` metadata remain immutable historical planning metadata. Executable evaluators are versioned separately as `selected-demo-engine-1`; implementing an evaluator does not rewrite an existing plan or source record.
- Class III MPE uses R 76-1 Table 6 with inclusive 500e and 2000e upper boundaries. Changeover and zero correction use A.4.4.3. Eccentricity uses 3.6.2.1 and A.4.7.1. Type-evaluation repeatability uses 3.6/3.6.1 and A.4.10. Every persisted rule result carries the applicable document hash, edition, clause, and printed/PDF pages.
- Environmental stability and equipment suitability remain explicit manual confirmations. Full R 111 equipment validation and Indian legal report acceptance remain `NOT VERIFIED FROM PROVIDED AUTHORITATIVE SOURCE` and are not automated.
- Calculated results are append-only and tied to a session version plus a canonical server input hash. Completing a failed selected test preserves FAIL; approval is a decision to issue the exact frozen submission and cannot alter observations or outcomes.
- Final PDF issuance is a reservation/render/upload/finalize sequence. The evaluation reaches `ISSUED` only after the private object digest and byte length are committed. A failed generation leaves the approved evaluation retryable at the same reservation.
