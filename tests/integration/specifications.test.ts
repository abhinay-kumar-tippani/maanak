// Vitest is installed in the integration-test environment in later setup.
// These cases intentionally remain a scaffold until a disposable Supabase
// backend and two distinct Auth roles are configured.
// @ts-expect-error Vitest is not installed in the current workspace yet.
import { describe, it } from "vitest";

describe("specification revision integration", () => {
  it.todo("first specification revision saves");
  it.todo("second revision preserves the first revision");
  it.todo("e and d remain distinct values");
  it.todo("stale row_version is rejected");
  it.todo("submitted or finalized evaluations cannot be edited");
  it.todo("cross-laboratory evaluation IDs are rejected");
  it.todo("changing specifications clears the active plan pointer");
  it.todo("a specification.revised audit event is created");
  it.todo("tester assignment is required");
  it.todo("an approver cannot save a specification");
});
