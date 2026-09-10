# Working agreement for this repository

The user chose Next.js, TypeScript, Supabase PostgreSQL/Auth/Storage and Vercel. Keep this stack. The title is a temporary working label, NAWI Lab. Source PDFs are immutable. The uploaded PS and the specified R76 editions define the metrology scope. Research and SWOT are secondary notes only.

Antigravity owns allowlisted UI work; Codex owns the database, auth/security, domain rules, transitions, tests and report snapshot/generation. Only one AI edits the repository at a time. Use a Git checkpoint after every verified stage. Do not reset, clean or overwrite the other person's uncommitted work. Inspect git status and generated AGENTS.md before changing files. Do not replace framework-generated instructions with this working agreement.

Critical code is in src/domain/oiml, src/server, supabase and tests. Shared client-safe types are in src/contracts. Metadata and form labels may be shared; live formulas, limits and verdicts are calculated only by server services. A pure domain function can be unit-tested without a database; its Next.js wrapper must import server-only. No AI call belongs in the evaluation path.

All formulas and limits must point to document edition, SHA-256, clause and printed/PDF page. Standard verification status is separate from whether code has been implemented/tested. Sources currently say SPECIFICATION_ONLY. Do not change that to implemented until actual code and golden tests are reviewed. Extend with a new version, never edit a published rule-set in place.

P0 only supports the explicit demo profile described in the blueprint. An unsupported profile is NOT_SUPPORTED, never silently treated as a class III instrument. The report states partial coverage. Missing tests are not marked N/A simply because the software cannot calculate them. Tester corrections preserve history, and approver approval cannot turn FAIL into PASS.

No service key, access token, password or connection string belongs in client code, git, reports, logs or screenshots. Use .env.local; commit only placeholder .env.example. Local UI route hiding is not authorization. Read policies, server checks and database command guards all apply.

After each stage: run the specified gate, inspect changes and create a checkpoint. Keep the installed package versions and package-lock.json fixed after setup. Add no global state framework, ORM, microservice, queue, Redis, custom auth or generic rule language today.
