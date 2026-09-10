# Test boundary

Tests are organized by responsibility and must exercise the same boundaries used in production.

- Domain tests call pure functions in `src/domain/oiml` with decimal-string inputs. They cover source-backed arithmetic, inclusive limits, completeness/procedure validation, unsupported profiles, and structured traces without requiring Supabase credentials.
- Workflow and integration tests exercise server actions, command RPCs, authorization, version/hash checks, state transitions, immutable results, report snapshots, and storage behavior against an explicitly configured test backend.
- Security tests use real authenticated sessions and verify forbidden reads/writes, role separation, laboratory scope, stale writes, and approval constraints. A service key alone is not an RLS test.

Tests must not trust browser-supplied PASS/FAIL values, fixture expected values, actor IDs, roles, tolerances, or rule versions. Test data and expected values remain decimal strings where they represent metrology quantities. Missing integration configuration is reported honestly as unavailable or skipped with a reason; it is never reported as a passing backend check.

The architecture stage adds no test runner, fixtures, credentials, or executable tests.
