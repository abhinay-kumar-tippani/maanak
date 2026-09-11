# SIH26035 selected-test demo runbook

## Implemented path

The application implements this limited workflow: tester sign-in → existing registered instrument and versioned specification → deterministic selected-demo plan → versioned raw observations and private evidence → server-only Decimal.js evaluation → immutable completed attempt or reasoned retest → selected-tests-ready state → frozen submitted report snapshot → independent approver decision against the exact submission ID and SHA-256 → final snapshot → Node-runtime React PDF rendering → unique private Storage object → issued report and authorized download.

The three evaluators are `WEIGHING_INITIAL`, `ECCENTRICITY_WEIGHTS`, and `REPEATABILITY_TYPE`. Their reports preserve decimal-string inputs, calculations, limits, outcomes, explanations, engine/rule versions, and OIML R 76 source references. The result remains **full type conformity NOT DETERMINED**.

The “Load fictional demo readings” action is available only for a saved specification matching DEMO-30. It loads raw fixture readings through the normal authorized save/evaluate services. It sets physical changeover confirmations, equipment suitability, environmental confirmation, and procedure confirmations to false, records no temperature, and uses `NOT_RECORDED` for the eccentricity sketch. It will therefore remain INCOMPLETE until a tester records the real manual facts and private sketch/evidence. It never overwrites an existing attempt.

## Remaining database action

Remote migration history could not be read from this workstation. Do not rerun migrations whose remote application status is uncertain. Confirm the development project’s migration table first. The registration ambiguity fix is `202609090006_registration_ambiguity_fix.sql`. The unapplied selected-plan migration was renamed to the unique version `202609090007_plans.sql`, followed by `202609090008_demo_workflow.sql`.

If 007 and 008 are absent remotely, execute [apply-remaining.sql](../scripts/apply-remaining.sql) once against the configured development project using the Supabase SQL editor or another supported database migration channel. The bundle contains only those two migrations, in dependency order. No live database or RLS integration check was completed in this task.

Create distinct active Auth users and matching `profiles` rows for one assigned TESTER and one APPROVER using the named placeholders in `scripts/bootstrap-demo.sql`. Do not share accounts or use a role switch.

## Environment variable names

Set these in `.env.local` without committing or displaying values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

## Start and test commands

```powershell
npm.cmd run test:domain
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev
```

## Route sequence

1. `/login` — sign in as the assigned TESTER.
2. `/instruments` → `/instruments/{instrumentId}` — open the existing sample.
3. `/instruments/{instrumentId}/specifications?evaluation={evaluationId}` — verify the current saved revision.
4. `/instruments/{instrumentId}/plan?evaluation={evaluationId}` — create/review the plan; optionally load fictional raw readings.
5. `/instruments/{instrumentId}/tests/{planItemId}?evaluation={evaluationId}` — record conditions, equipment, confirmations, observations and private evidence; calculate, inspect PASS/FAIL explanation, then complete each selected test. Use a nonempty reason for a retest.
6. Return to the plan page, complete selected tests, and submit the frozen snapshot.
7. Sign in as the APPROVER and use `/approvals` → `/approvals/{evaluationId}` to approve, reject, or request correction. Comments are mandatory for rejection/correction and for approval when any selected test failed.
8. `/reports` — as the approver, generate/issue the final PDF; as any authorized evaluation reader, download the READY artifact privately.

## Deliberate limits and pending proof

- The UI and server build are verified locally. Browser interaction was not exercised in this task.
- PostgreSQL command syntax, RLS denial cases, concurrent review, Storage upload/download, and PDF issuance still require execution against the configured development backend after migration status is confirmed.
- Evidence is limited to PDF/PNG/JPEG up to 2 MiB. Missing evidence/manual checks cannot PASS.
- Omitted catalogue families remain `NOT_IMPLEMENTED` or `UNVERIFIED`; they are not silently `NOT_APPLICABLE`.
- The output is a selected-tests demonstration report, not a Model Approval Certificate, accreditation claim, legal digital signature, or Indian acceptance claim.
