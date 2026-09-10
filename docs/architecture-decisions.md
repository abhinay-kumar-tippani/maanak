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
