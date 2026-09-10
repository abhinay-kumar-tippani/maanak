# Chronological implementation runbook



Use one stage at a time. Do not skip the TEST or DONE CONDITION. The first response starts stages 0 and 1; later prompts are saved here so the architecture and ownership stay consistent. Step-specific file allowlists override the default prohibition only for the explicitly listed paths. No agent has permission to rewrite the entire repository.



## STEP 0 - Document analysis

**OWNER:** ARCHITECT

**OBJECTIVE:** Freeze the source set and a defensible test scope.

**WHY:** Avoid invented formulas and false coverage.

**MANUAL ACTION:** Use the three PDFs in docs/reference. Open the listed pages and compare the clause registry. Treat research/SWOT as secondary.

**TERMINAL COMMANDS:**

```powershell

Get-FileHash .\docs\reference\r076-1-e06.pdf -Algorithm SHA256
Get-FileHash .\docs\reference\r076-2-e07.pdf -Algorithm SHA256

```

**FILES:** docs/reference/*; docs/source-manifest.json; docs/rule-registry.json; docs/test-catalogue.json

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/00-architect.txt](prompts/00-architect.txt).

**EXPECTED RESULT:** Freeze the source set and a defensible test scope.

**TEST:** Hash equality; required thresholds/counts and formulas match the cited printed pages.

**FAILURE CHECK:** Do not use a research cheat sheet as the source or assume PDF length fixes report length.

**DONE CONDITION:** Registry complete for the three scoped tests; unsupported/legal details visibly unverified.



## STEP 1 - Project initialization

**OWNER:** ANTIGRAVITY

**OBJECTIVE:** Create a buildable Next.js foundation.

**WHY:** All later changes need a known working baseline.

**MANUAL ACTION:** Create the app from a parent folder, open it in VS Code, then copy the build kit folders without overwriting generated configuration.

**TERMINAL COMMANDS:**

```powershell

node --version
npm --version
git --version
npx create-next-app@latest nawi-lab --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
cd nawi-lab
code .
npm run build
npm run dev

```

**FILES:** src/app/layout.tsx; src/app/globals.css; src/app/page.tsx; src/app/(lab)/layout.tsx; src/app/(lab)/dashboard/page.tsx

**ANTIGRAVITY PROMPT:** Copy the complete prompt in [docs/prompts/01-antigravity.txt](prompts/01-antigravity.txt).

**CODEX PROMPT:** Not used for this stage.

**EXPECTED RESULT:** Create a buildable Next.js foundation.

**TEST:** Run npm run build and npx tsc --noEmit; open /dashboard and refresh it.

**FAILURE CHECK:** If create-next-app refuses a nonempty folder, create its named child from the parent. If port 3000 is occupied, follow the printed URL.

**DONE CONDITION:** Build exits 0; dashboard renders; no fake data; changed files remain within allowlist.



## STEP 2 - Dependencies and UI primitives

**OWNER:** MANUAL

**OBJECTIVE:** Install the minimal agreed dependencies and scripts.

**WHY:** Avoid package churn after domain work begins.

**MANUAL ACTION:** Run npm commands inside nawi-lab. For shadcn choose the existing Next project and a neutral/slate base.

**TERMINAL COMMANDS:**

```powershell

npm install @supabase/supabase-js @supabase/ssr zod decimal.js server-only lucide-react @react-pdf/renderer
npm install -D vitest @playwright/test supabase
npx shadcn@latest init
npx shadcn@latest add button card input label table badge textarea select separator dialog tabs alert sonner
npm pkg set "scripts.lint=eslint ." "scripts.typecheck=tsc --noEmit" "scripts.test=vitest run"
npm run lint
npm run build

```

**FILES:** package.json; package-lock.json; components.json; src/components/ui/*; src/lib/utils.ts; src/app/globals.css

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Not used for this stage.

**EXPECTED RESULT:** Install the minimal agreed dependencies and scripts.

**TEST:** npm ls --depth=0; npm run lint; npm run build. Do not run the still-empty unit suite yet.

**FAILURE CHECK:** Do not use next lint; use ESLint directly. Resolve React/PDF compatibility during the early PDF spike.

**DONE CONDITION:** Lockfile saved; dependencies install; baseline builds.



## STEP 3 - Architecture and contracts

**OWNER:** CODEX

**OBJECTIVE:** Establish stable boundaries before feature work.

**WHY:** UI and engine must share types without sharing privileged runtime code.

**MANUAL ACTION:** Copy docs, fixtures, supabase and src/contracts from the kit; inspect Git changes.

**TERMINAL COMMANDS:**

```powershell

git status --short
npm run typecheck

```

**FILES:** src/contracts/*; src/server/README.md; src/domain/oiml/README.md; tests/README.md; docs/architecture-decisions.md

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/03-codex.txt](prompts/03-codex.txt).

**EXPECTED RESULT:** Establish stable boundaries before feature work.

**TEST:** TypeScript compiles; no server dependency imported by shared contracts.

**FAILURE CHECK:** An import server-only marker belongs in runtime wrappers, not client-safe DTOs.

**DONE CONDITION:** One agreed contract and server/domain ownership are recorded.



## STEP 4 - Supabase project

**OWNER:** MANUAL

**OBJECTIVE:** Create the remote development backend.

**WHY:** A cloud project avoids running Docker on the laptop today.

**MANUAL ACTION:** In Supabase create a fresh project in a suitable region, record the project reference, URL and publishable key. Keep the secret key private. Create two password Auth users, tester and approver, without sending invitations. Record their UUIDs; no shared account.

**TERMINAL COMMANDS:**

```powershell

npx supabase init
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF

```

**FILES:** supabase/config.toml; .env.local; .env.example

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Not used for this stage.

**EXPECTED RESULT:** Create the remote development backend.

**TEST:** Dashboard shows project; CLI link succeeds; .env.local is ignored by Git.

**FAILURE CHECK:** Use the project URL, not the dashboard URL. Never put secret key in NEXT_PUBLIC variables.

**DONE CONDITION:** Project linked; two real user UUIDs recorded; no secrets in git.



## STEP 5 - Schema and security foundation

**OWNER:** CODEX

**OBJECTIVE:** Apply the supplied tables and read/security baseline.

**WHY:** Later features must persist real records in a secured schema.

**MANUAL ACTION:** Use the fresh project only. Inspect both migrations before applying. Bootstrap one fictional lab and the two profile rows using your real Auth UUIDs in a new manual bootstrap script.

**TERMINAL COMMANDS:**

```powershell

npx supabase db push
npx supabase gen types typescript --linked > src/contracts/database.ts

```

**FILES:** supabase/migrations/202609090001_foundation.sql; supabase/migrations/202609090002_security.sql; scripts/bootstrap-demo.sql; src/contracts/database.ts

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/05-codex.txt](prompts/05-codex.txt).

**EXPECTED RESULT:** Apply the supplied tables and read/security baseline.

**TEST:** Apply successfully; tables and private buckets exist; SELECT with no JWT sees no app data. Run schema queries to confirm RLS enabled and no authenticated business-write grants.

**FAILURE CHECK:** Schema migration succeeds before bootstrap; placeholder Auth UUIDs must be replaced. SQL functions currently missing are intentionally added in later stages.

**DONE CONDITION:** Migrations recorded; profiles exist; baseline access is closed; database types regenerated.



## STEP 6 - Server-side authentication

**OWNER:** CODEX

**OBJECTIVE:** Implement login, logout and authenticated routing.

**WHY:** A profile/role label is useful only with a verified identity.

**MANUAL ACTION:** Set Supabase Site URL to local development URL for now; add local auth callback if used. Use email/password to avoid email delivery dependencies.

**TERMINAL COMMANDS:**

```powershell

npm run lint
npm run typecheck
npm run build
npm run dev

```

**FILES:** src/lib/supabase/browser.ts; src/lib/supabase/server.ts; src/lib/supabase/proxy.ts; src/proxy.ts; src/server/auth/*; src/app/(auth)/login/*; src/app/(lab)/layout.tsx

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/06-codex.txt](prompts/06-codex.txt).

**EXPECTED RESULT:** Implement login, logout and authenticated routing.

**TEST:** Tester logs in; refresh preserves session; logout returns to /login; copied protected URL while logged out redirects.

**FAILURE CHECK:** Use proxy.ts only with the installed Next.js version that supports it; async cookies and awaited route params must match that version.

**DONE CONDITION:** Both accounts authenticate; protected routes are server-checked; no secrets in client bundle.



## STEP 7 - Authorization, transaction and state guards

**OWNER:** CODEX

**OBJECTIVE:** Build the command boundary and state guard before CRUD.

**WHY:** Direct browser writes must not forge outcomes or approvals.

**MANUAL ACTION:** Read docs/security-contract.md and the state table. Keep the existing RLS baseline.

**TERMINAL COMMANDS:**

```powershell

npm run lint
npm run typecheck
npm run test -- tests/workflow/state-machine.test.ts

```

**FILES:** src/server/auth/authorize.ts; src/server/db/commands.ts; src/server/workflow/*; supabase/migrations/202609090003_command_guards.sql; tests/workflow/*; tests/security/*

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/07-codex.txt](prompts/07-codex.txt).

**EXPECTED RESULT:** Build the command boundary and state guard before CRUD.

**TEST:** Prove tester cannot promote own role; admin is not approver; invalid transitions throw; closed evaluations cannot accept edits.

**FAILURE CHECK:** Service keys bypass RLS: every privileged write still needs explicit checks. Guard actor context is not user input.

**DONE CONDITION:** Command boundary exists; deny tests pass against the test backend; state guard migration applied.



## STEP 8 - Early deployment and PDF smoke spike

**OWNER:** CODEX

**OBJECTIVE:** Test Vercel/Auth/PDF compatibility before building all features.

**WHY:** Late deployment and PDF failures are expensive.

**MANUAL ACTION:** Log into Vercel CLI on your laptop; deploy a preview and set the same env variables in the correct Vercel environment. Keep access appropriate for the demo.

**TERMINAL COMMANDS:**

```powershell

npx vercel
npm run build

```

**FILES:** src/app/api/health/pdf/route.ts; src/server/reports/health-pdf.tsx

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/08-codex.txt](prompts/08-codex.txt).

**EXPECTED RESULT:** Test Vercel/Auth/PDF compatibility before building all features.

**TEST:** Open login and protected dashboard on preview; download smoke PDF on Vercel and inspect it.

**FAILURE CHECK:** Do not use Edge runtime for PDF. Keep response small; no external font downloads. Fix actual bundler errors before proceeding.

**DONE CONDITION:** Auth works on Vercel; PDF opens remotely; dependency lock stays stable.



## STEP 9 - Application shell and dashboard

**OWNER:** ANTIGRAVITY

**OBJECTIVE:** Create professional navigation and live dashboard views.

**WHY:** Judges need to understand status quickly.

**MANUAL ACTION:** Provide database DTOs and available authorized read queries; do not let the UI invent new API names.

**TERMINAL COMMANDS:**

```powershell

npm run lint
npm run build

```

**FILES:** src/components/layout/*; src/components/status/*; src/features/dashboard/components/*; src/app/(lab)/dashboard/page.tsx; src/app/(lab)/layout.tsx

**ANTIGRAVITY PROMPT:** Copy the complete prompt in [docs/prompts/09-antigravity.txt](prompts/09-antigravity.txt).

**CODEX PROMPT:** Not used for this stage.

**EXPECTED RESULT:** Create professional navigation and live dashboard views.

**TEST:** Counts reconcile with authorized database queries; keyboard navigation and empty state work.

**FAILURE CHECK:** Do not make whole layout a client component merely for active navigation.

**DONE CONDITION:** Readable desktop layout; real metrics; accurate status language.



## STEP 10 - Instrument/model registration

**OWNER:** CODEX

**OBJECTIVE:** Save manufacturer, applicant, model, specimen and evaluation together.

**WHY:** Model identity and the particular instrument under test are different records.

**MANUAL ACTION:** Use one fictional lab and enter a fictional instrument without pretending it is an official example.

**TERMINAL COMMANDS:**

```powershell

npm run typecheck
npm run test -- tests/integration/registration.test.ts

```

**FILES:** src/server/instruments/*; src/server/actions/instruments.ts; src/features/instruments/*; src/app/(lab)/instruments/*; supabase/migrations/202609090004_registration.sql; tests/integration/registration.test.ts

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/10-codex.txt](prompts/10-codex.txt).

**EXPECTED RESULT:** Save manufacturer, applicant, model, specimen and evaluation together.

**TEST:** Create/save/refresh returns same records; duplicate sample errors are friendly; cross-lab FK injection rejected; audit has registration events.

**FAILURE CHECK:** A row ID from a URL is untrusted. Do not reuse model ID as evaluation ID.

**DONE CONDITION:** Registration persists and the detail page survives refresh.



## STEP 11 - Specifications and manual intake checks

**OWNER:** ANTIGRAVITY

**OBJECTIVE:** Collect declared characteristics and source-supported intake evidence.

**WHY:** Applicability must use saved, versioned specifications.

**MANUAL ACTION:** Ask Codex to implement command_save_specification from the security contract before wiring the form; this stage includes two sequential agents, never simultaneous edits.

**TERMINAL COMMANDS:**

```powershell

npm run typecheck
npm run build

```

**FILES:** UI: src/features/specifications/components/*; src/app/(lab)/instruments/[id]/specifications/page.tsx. CODEX prerequisite: src/server/specifications/*; src/server/actions/specifications.ts; supabase/migrations/202609090005_specifications.sql; tests/integration/specifications.test.ts

**ANTIGRAVITY PROMPT:** Copy the complete prompt in [docs/prompts/11-antigravity.txt](prompts/11-antigravity.txt).

**CODEX PROMPT:** Run the explicit Codex prerequisite below before giving the UI prompt.

**EXPECTED RESULT:** Collect declared characteristics and source-supported intake evidence.

**TEST:** Save/reload matches values; e and d remain distinct; new specification revision invalidates current plan/results; prior versions remain readable.

**FAILURE CHECK:** Do not overwrite specifications referenced by completed/approved data.

**DONE CONDITION:** Saved characteristics and confirmations exist; future edits have versioned history.



**Codex prerequisite:** [11-codex-prerequisite.txt](prompts/11-codex-prerequisite.txt).



## STEP 12 - Test definitions and scoped plan

**OWNER:** CODEX

**OBJECTIVE:** Build the three selected tests and full coverage catalogue.

**WHY:** A plan must distinguish applicable/unknown/unimplemented requirements.

**MANUAL ACTION:** Supply rule registry and catalogue. Keep the demo profile narrow.

**TERMINAL COMMANDS:**

```powershell

npm run test -- tests/domain/plan.test.ts
npm run typecheck

```

**FILES:** src/domain/oiml/definitions/*; src/domain/oiml/plans/*; src/domain/oiml/schemas/*; src/server/plans/*; src/server/actions/plans.ts; supabase/migrations/202609090006_plans.sql; tests/domain/plan.test.ts

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/12-codex.txt](prompts/12-codex.txt).

**EXPECTED RESULT:** Build the three selected tests and full coverage catalogue.

**TEST:** Unsupported range/class rejected with NOT_SUPPORTED; plan contains verified selected procedures and explicit omitted coverage; source refs visible.

**FAILURE CHECK:** Auto-selecting only three tests is not a complete OIML applicability resolver.

**DONE CONDITION:** Scoped plan persists with correct revision and no invented test requirements.



## STEP 13 - Pure calculation framework

**OWNER:** CODEX

**OBJECTIVE:** Implement reusable Decimal arithmetic and trace output.

**WHY:** UI-independent calculations must be reproducible.

**MANUAL ACTION:** Provide verified source example and exact Table 6 bounds from registry.

**TERMINAL COMMANDS:**

```powershell

npm run test -- tests/domain/calculators.test.ts
npm run typecheck

```

**FILES:** src/domain/oiml/calculators/*; src/domain/oiml/rules/*; src/domain/oiml/references/*; tests/domain/calculators.test.ts; src/server/evaluation/engine.ts

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/13-codex.txt](prompts/13-codex.txt).

**EXPECTED RESULT:** Implement reusable Decimal arithmetic and trace output.

**TEST:** All golden arithmetic cases pass; rounding does not alter decisions; empty strings do not become 0.

**FAILURE CHECK:** Comparing error/e after rounding can flip boundary results. Avoid parseFloat multiplication and epsilon tolerances.

**DONE CONDITION:** Primitives and trace references independently tested before UI connection.



## STEP 14 - Three representative evaluators

**OWNER:** CODEX

**OBJECTIVE:** Finish weighing, eccentricity and repeatability calculations with completeness checks.

**WHY:** Per-row math alone cannot establish a completed test.

**MANUAL ACTION:** Compare each evaluator against source pages and fixtures before connecting it.

**TERMINAL COMMANDS:**

```powershell

npm run test -- tests/domain
npm run typecheck

```

**FILES:** src/domain/oiml/evaluators/*; src/domain/oiml/validation/*; src/server/evaluation/*; supabase/migrations/202609090007_test_commands.sql; tests/domain/*; tests/integration/evaluation.test.ts

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/14-codex.txt](prompts/14-codex.txt).

**EXPECTED RESULT:** Finish weighing, eccentricity and repeatability calculations with completeness checks.

**TEST:** All evaluator tests pass; fixture arithmetic matches source; negative individual error fails even when repeatability spread is zero.

**FAILURE CHECK:** Repeatability must not subtract separately estimated zero errors from each observation.

**DONE CONDITION:** Source/code review complete; selected evaluators genuinely implemented/tested; registry release records updated without changing source hashes.



## STEP 15 - Observation entry interface

**OWNER:** ANTIGRAVITY

**OBJECTIVE:** Build three tailored observation grids with one common shell.

**WHY:** Different procedures need different input structures.

**MANUAL ACTION:** Use validated observation DTOs and existing save/evaluate actions.

**TERMINAL COMMANDS:**

```powershell

npm run lint
npm run build

```

**FILES:** src/features/tests/components/*; src/app/(lab)/instruments/[id]/tests/*

**ANTIGRAVITY PROMPT:** Copy the complete prompt in [docs/prompts/15-antigravity.txt](prompts/15-antigravity.txt).

**CODEX PROMPT:** Not used for this stage.

**EXPECTED RESULT:** Build three tailored observation grids with one common shell.

**TEST:** Enter one row, save, refresh; evaluate returns trace; missing row gives exact field message; change an input and stale PASS is not displayed as current.

**FAILURE CHECK:** Optimistic styling must not commit or trust a client-side verdict.

**DONE CONDITION:** All required input structures work; values persist; server-only results are obvious.



## STEP 16 - Completion and test summary

**OWNER:** CODEX

**OBJECTIVE:** Finish selected tests and readiness checks.

**WHY:** Completeness and outcome must stay separate.

**MANUAL ACTION:** Try incomplete, failed and passed test attempts.

**TERMINAL COMMANDS:**

```powershell

npm run test -- tests/integration/completion.test.ts
npm run typecheck

```

**FILES:** src/server/workflow/completion.ts; src/server/actions/tests.ts; src/features/results/*; src/app/(lab)/instruments/[id]/results/page.tsx; supabase/migrations/202609090008_completion.sql; tests/integration/completion.test.ts

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/16-codex.txt](prompts/16-codex.txt).

**EXPECTED RESULT:** Finish selected tests and readiness checks.

**TEST:** An incomplete test cannot complete; failed test can complete accurately; retest preserves original; summary matches current saved results.

**FAILURE CHECK:** Do not use every historical failed attempt for current dashboard FAIL count; label historical failures separately.

**DONE CONDITION:** Summary reflects real selected-test completion and explicit partial coverage.



## STEP 17 - Snapshot and submission

**OWNER:** CODEX

**OBJECTIVE:** Freeze the report data that an approver will review.

**WHY:** Approval must refer to an immutable version, not changing live tables.

**MANUAL ACTION:** Provide ReportSnapshot contract and source report field map.

**TERMINAL COMMANDS:**

```powershell

npm run test -- tests/integration/submission.test.ts
npm run typecheck

```

**FILES:** src/server/reports/snapshot.ts; src/server/actions/submission.ts; supabase/migrations/202609090009_submission.sql; tests/integration/submission.test.ts

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/17-codex.txt](prompts/17-codex.txt).

**EXPECTED RESULT:** Freeze the report data that an approver will review.

**TEST:** Saved v1 remains identical after party master edits; simultaneous submit has one current submission; post-submit raw edits blocked.

**FAILURE CHECK:** Separate HTTP .insert calls are not a transaction.

**DONE CONDITION:** Submitted version and digest are frozen; reviewer sees exactly that version.



## STEP 18 - Approval queue and review UI

**OWNER:** ANTIGRAVITY

**OBJECTIVE:** Expose submitted evidence and decision controls.

**WHY:** Review should make the calculation defensible.

**MANUAL ACTION:** Use approver account and existing authorized review reads.

**TERMINAL COMMANDS:**

```powershell

npm run lint
npm run build

```

**FILES:** src/features/approvals/components/*; src/app/(lab)/approvals/*; src/app/(lab)/instruments/[id]/report/page.tsx

**ANTIGRAVITY PROMPT:** Copy the complete prompt in [docs/prompts/18-antigravity.txt](prompts/18-antigravity.txt).

**CODEX PROMPT:** Not used for this stage.

**EXPECTED RESULT:** Expose submitted evidence and decision controls.

**TEST:** Approver can inspect each input, limit and source; tester navigation hides review controls and server denies queue access.

**FAILURE CHECK:** A preview built from live instruments tables can differ from approved snapshot.

**DONE CONDITION:** Review is read-only evidence display; decisions target explicit version/hash.



## STEP 19 - Review decisions and corrections

**OWNER:** CODEX

**OBJECTIVE:** Implement approve, reject and correction requests safely.

**WHY:** A click must not bypass independent review or rewrite results.

**MANUAL ACTION:** Use tester/approver in separate browser profiles.

**TERMINAL COMMANDS:**

```powershell

npm run test -- tests/integration/review.test.ts
npm run typecheck

```

**FILES:** src/server/approvals/*; src/server/actions/approvals.ts; supabase/migrations/202609090010_review.sql; tests/integration/review.test.ts

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/19-codex.txt](prompts/19-codex.txt).

**EXPECTED RESULT:** Implement approve, reject and correction requests safely.

**TEST:** Tester cannot self-approve; stale version rejected; two concurrent reviewers create one decision; v1 remains after corrections/v2.

**FAILURE CHECK:** Do not overwrite completed raw readings merely because correction was requested.

**DONE CONDITION:** All three decisions work and record actor/time/comment with history.



## STEP 20 - Report PDF template

**OWNER:** CODEX

**OBJECTIVE:** Render a professional report from the frozen snapshot.

**WHY:** A printed report is the main deliverable.

**MANUAL ACTION:** Compare generated sections to R76-2 forms; inspect every output page.

**TERMINAL COMMANDS:**

```powershell

npm run test -- tests/reports
npm run build

```

**FILES:** src/server/reports/pdf/*; src/server/reports/render.tsx; tests/reports/*; src/app/api/reports/[id]/generate/route.ts

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/20-codex.txt](prompts/20-codex.txt).

**EXPECTED RESULT:** Render a professional report from the frozen snapshot.

**TEST:** PDF renders locally and remotely; compare every included numerical cell to snapshot; long names/remarks do not clip; all observation rows included.

**FAILURE CHECK:** No browser-only PDF package: use @react-pdf/renderer, not react-pdf viewer.

**DONE CONDITION:** Readable PDF faithfully represents the selected source forms and scope.



## STEP 21 - Private storage and final issuance

**OWNER:** CODEX

**OBJECTIVE:** Save PDF reliably and mark it issued only after success.

**WHY:** An approved record is not proof a PDF was produced.

**MANUAL ACTION:** Simulate a failed upload before testing success.

**TERMINAL COMMANDS:**

```powershell

npm run test -- tests/integration/issuance.test.ts
npm run typecheck

```

**FILES:** src/server/reports/issue.ts; src/server/storage/*; src/server/actions/reports.ts; supabase/migrations/202609090011_issuance.sql; tests/integration/issuance.test.ts

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/21-codex.txt](prompts/21-codex.txt).

**EXPECTED RESULT:** Save PDF reliably and mark it issued only after success.

**TEST:** Upload failure stays APPROVED/FAILED artifact with Retry; retry issues once; original bytes never overwritten; unauthorized download fails.

**FAILURE CHECK:** Storage and database are not one transaction. Handle orphan uploaded bytes safely with reservation/retry logic.

**DONE CONDITION:** Final PDF is READY in private repository; ISSUED audit is accurate.



## STEP 22 - Repository, audit and route completion

**OWNER:** ANTIGRAVITY

**OBJECTIVE:** Finish the navigable end-to-end application.

**WHY:** Judges need retrieval and history beyond the success toast.

**MANUAL ACTION:** Verify all intended sidebar links point to working routes.

**TERMINAL COMMANDS:**

```powershell

npm run lint
npm run build

```

**FILES:** src/features/reports/components/*; src/features/audit/components/*; src/app/(lab)/reports/*; src/app/(lab)/audit/*; src/components/layout/*

**ANTIGRAVITY PROMPT:** Copy the complete prompt in [docs/prompts/22-antigravity.txt](prompts/22-antigravity.txt).

**CODEX PROMPT:** Not used for this stage.

**EXPECTED RESULT:** Finish the navigable end-to-end application.

**TEST:** Report found after refresh/search; v1/v2/final remain distinct; timeline shows original and changed demo input.

**FAILURE CHECK:** Do not log login by simply rendering dashboard: use successful Auth events/service audit.

**DONE CONDITION:** All P0 routes work and contain genuine persisted records.



## STEP 23 - Demo fixtures

**OWNER:** CODEX

**OBJECTIVE:** Seed a reproducible fictional demonstration.

**WHY:** The presenter needs reliable data and a clean backup evaluation.

**MANUAL ACTION:** Keep DEMO_MODE explicit; never run demo reset against non-demo data.

**TERMINAL COMMANDS:**

```powershell

node --env-file=.env.local scripts/seed-demo.mjs

```

**FILES:** scripts/seed-demo.mjs; fixtures/demo-observations.json; tests/fixtures/*

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/23-codex.txt](prompts/23-codex.txt).

**EXPECTED RESULT:** Seed a reproducible fictional demonstration.

**TEST:** Seed rerun creates no duplicates; results recomputed match fixtures; report says no physical tests performed.

**FAILURE CHECK:** Golden fixture expected fields are test assertions, never trusted as database results.

**DONE CONDITION:** Ready demo data and a recoverable backup exist with honest labels.



## STEP 24 - Security and workflow integration gate

**OWNER:** CODEX

**OBJECTIVE:** Resolve the concrete risks of a multi-user backend.

**WHY:** UI success alone cannot establish permissions and locking.

**MANUAL ACTION:** Use a fresh disposable test lab and dedicated test users; do not clear demo records.

**TERMINAL COMMANDS:**

```powershell

npm run test -- tests/domain tests/workflow tests/integration tests/security

```

**FILES:** tests/integration/*; tests/security/*; only failing feature files as specifically justified

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Copy the complete prompt in [docs/prompts/24-codex.txt](prompts/24-codex.txt).

**EXPECTED RESULT:** Resolve the concrete risks of a multi-user backend.

**TEST:** All allowed paths succeed and forbidden paths fail; no reliance solely on service-role tests.

**FAILURE CHECK:** A test using the service key to read cross-lab data is not an RLS test.

**DONE CONDITION:** Named negative tests pass with real credentials and RLS.



## STEP 25 - End-to-end rehearsal

**OWNER:** MANUAL

**OBJECTIVE:** Walk the full judging flow before the final deployment.

**WHY:** Catch navigation, session and presentation failures.

**MANUAL ACTION:** Open tester in normal browser and approver in a separate browser profile. Rehearse the demo script twice.

**TERMINAL COMMANDS:**

```powershell

npm run lint
npm run typecheck
npm run test
npm run build
npm run start

```

**FILES:** docs/demo-script.md; docs/acceptance-log.md

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Not used for this stage.

**EXPECTED RESULT:** Walk the full judging flow before the final deployment.

**TEST:** Register -> specs -> plan -> save/evaluate -> three complete -> submit -> review -> approve -> PDF -> repository -> audit; all work after refresh.

**FAILURE CHECK:** Do not use the same cookie profile for both roles.

**DONE CONDITION:** Two clean rehearsals on a production build; no blocking console/server errors.



## STEP 26 - Production Vercel deployment

**OWNER:** MANUAL

**OBJECTIVE:** Deploy the tested revision with matching configuration.

**WHY:** Local success does not guarantee remote success.

**MANUAL ACTION:** In Vercel set production environment variables, apply pending migrations, set Supabase production Site URL and permitted redirect URLs to the actual returned deployment URL, and redeploy if NEXT_PUBLIC values changed.

**TERMINAL COMMANDS:**

```powershell

npx supabase db push
npm run build
npx vercel --prod

```

**FILES:** Vercel project settings; Supabase Auth URL settings; docs/deployment.md

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Not used for this stage.

**EXPECTED RESULT:** Deploy the tested revision with matching configuration.

**TEST:** Open actual production URL in a clean browser; login and PDF issuance both work.

**FAILURE CHECK:** Environment variables are environment-specific; changing public vars needs a rebuild; a preview URL is not the final demo URL.

**DONE CONDITION:** Deployment healthy; production configuration recorded; public exposure of sensitive data avoided.



## STEP 27 - Deployed acceptance and fallback

**OWNER:** MANUAL

**OBJECTIVE:** Validate the exact URL the judges will use.

**WHY:** The final system must work outside localhost.

**MANUAL ACTION:** Repeat the critical smoke flow on production and download the final demo PDF. Save a short screen recording locally as a presentation fallback.

**TERMINAL COMMANDS:**

```powershell

npx vercel inspect YOUR_PRODUCTION_URL

```

**FILES:** docs/acceptance-log.md; docs/deployment.md

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Not used for this stage.

**EXPECTED RESULT:** Validate the exact URL the judges will use.

**TEST:** Clean-session login, save/refresh, one boundary evaluation, role separation, approve/issue/download, repository and audit. Test on the venue connection if available.

**FAILURE CHECK:** A local backup PDF is a fallback artifact, not evidence the deployed workflow succeeded.

**DONE CONDITION:** Hosted workflow verified and backup artifacts available.



## STEP 28 - Judging preparation

**OWNER:** MANUAL

**OBJECTIVE:** Present one coherent demonstration and defend the arithmetic.

**WHY:** A narrow, accurate claim is easier to defend.

**MANUAL ACTION:** Assign one person to explain the problem, one to operate the tester flow and one to explain review/PDF. Practice the source-backed 10kg example and partial-coverage answer.

**TERMINAL COMMANDS:**

```powershell

git status --short

```

**FILES:** docs/demo-script.md

**ANTIGRAVITY PROMPT:** Not used for this stage.

**CODEX PROMPT:** Not used for this stage.

**EXPECTED RESULT:** Present one coherent demonstration and defend the arithmetic.

**TEST:** Presenter can explain E, Ec, e vs d, MPE boundaries, 2x10 repeatability, version pinning and approval meaning in plain words.

**FAILURE CHECK:** Do not claim full compliance, legal signature validity, hardware automation or a Model Approval Certificate.

**DONE CONDITION:** Demo fits 5-7 minutes and every claim matches the running prototype.


## Sequential backend/UI handoffs

Run the following added prompts in order at the specified stage. These complete the actual query/action dependencies; do not ask Antigravity to invent an API.

| Stage | Backend first | UI second |
|---|---|---|
| 9 | [09-codex-prerequisite.txt](prompts/09-codex-prerequisite.txt) defines getDashboard | [09-antigravity.txt](prompts/09-antigravity.txt) |
| 10 | [10-codex.txt](prompts/10-codex.txt) defines registration and list/detail queries | [10-antigravity.txt](prompts/10-antigravity.txt) |
| 11 | [11-codex-prerequisite.txt](prompts/11-codex-prerequisite.txt) | [11-antigravity.txt](prompts/11-antigravity.txt) |
| 12 | [12-codex.txt](prompts/12-codex.txt) defines plan actions/queries | [12-antigravity.txt](prompts/12-antigravity.txt) |
| 18 | [18-codex-prerequisite.txt](prompts/18-codex-prerequisite.txt) | [18-antigravity.txt](prompts/18-antigravity.txt) |
| 22 | [22-codex-prerequisite.txt](prompts/22-codex-prerequisite.txt) | [22-antigravity.txt](prompts/22-antigravity.txt) |

At stage 7 configure Vitest and aliases in vitest.config.ts/tests/setup.ts, loading private local test configuration only in the test runner. Domain tests need no Supabase secrets; integration tests must explicitly require test backend credentials and fail/skip honestly with a clear reason if missing. Never report skipped integration tests as passed. Do not include private test configuration in a Next.js client import.

The source pack intentionally has no preexisting runtime rule implementation or functioning command RPCs. It is a reviewed specification and schema foundation for the controlled stages. Future stage prompts refer to files created by earlier stages; do not run them out of order.
