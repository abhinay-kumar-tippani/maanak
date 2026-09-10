// Vitest is installed in the integration-test environment in later setup.
// This scaffold intentionally does not claim a live backend result.
// @ts-expect-error Vitest is not installed in the current workspace yet.
import { describe, it } from "vitest";

describe("instrument registration integration", () => {
  it.todo("tester can register a model and receives linked IDs");
  it.todo("registration creates manufacturer, applicant, model, instrument, and DRAFT evaluation records");
  it.todo("duplicate sample identifier is rejected with DUPLICATE_SAMPLE");
  it.todo("approver cannot register");
  it.todo("cross-laboratory actor or assigned-tester injection is rejected");
  it.todo("registration creates an instrument.registered audit event");
  it.todo("a failed transaction leaves no partial records");
});
