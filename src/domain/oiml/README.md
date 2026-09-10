# OIML domain boundary

`src/domain/oiml` contains pure, independently testable metrology logic. Domain functions accept typed values and explicit context, perform validation/calculation/evaluation, and return structured values and issues. They do not import Next.js, Supabase, filesystem/storage clients, request state, environment values, or an LLM.

Numeric metrology values cross every boundary as decimal strings (`DecimalText` in `src/contracts/domain.ts`) with explicit units. Decimal arithmetic belongs inside reviewed domain functions; formatting is presentation only. A server wrapper loads persisted inputs and supplies source references, rule-set version, engine version, and evaluation context.

Every implemented rule must retain its document edition, SHA-256, clause, and printed/PDF page references. Source verification is separate from implementation and test completion: the current source pack is `SPECIFICATION_ONLY` until the corresponding implementation and golden tests are reviewed. Missing or unverified source evidence cannot produce an automated conformity claim.

## Supported P0 demonstration scope

The exact supported profile is a complete digital Class III single-interval ordinary platform instrument, without auxiliary indication, with `e = d`, `e >= 5 g`, `Max < 1000 kg`, at most four support points, no additive tare, and no extended-resolution mode used for testing. Initial-zero-setting range above 20% of Max is unsupported. Other classes, ranges, receptors, modules, and unsupported features are `NOT_SUPPORTED`, never silently coerced.

The fictional `DEMO-30` profile is Max 30 kg, Min 200 g, `e = d = 10 g`, `n = 3000`, and one support point. Its selected demonstration tests are initial intrinsic error (weighing), eccentricity using weights, and type-evaluation repeatability. Three selected tests are partial coverage; overall conformity remains `NOT_DETERMINED`.

This directory intentionally contains no calculator or evaluator implementation in the architecture-boundary stage.
