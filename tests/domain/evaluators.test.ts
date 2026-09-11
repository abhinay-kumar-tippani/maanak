import test from "node:test";
import assert from "node:assert/strict";
import type { InstrumentSpecifications, WeighingObservations, EccentricityObservations, RepeatabilityObservations } from "../../src/contracts/domain";
import type { EvaluateSelectedInput } from "../../src/domain/oiml/evaluators/selected";
import { changeoverErrorG, classIIIMpeG, evaluateSelectedTest } from "../../src/domain/oiml/evaluators/selected";

const specs: InstrumentSpecifications = {
  accuracyClass: "III", maxG: "30000", minG: "200", eG: "10", dG: "10", rangeType: "SINGLE_INTERVAL",
  category: "COMPLETE_INSTRUMENT", indication: "DIGITAL", auxiliaryIndication: false, extendedIndicationUsed: false,
  isGradingInstrument: false, receptor: "ORDINARY_PLATFORM", supportPoints: 1, maximumAdditiveTareG: "0",
  initialZeroSettingRangePercent: "4", automaticZeroSettingExists: false, zeroTrackingExists: true,
  declaredTemperatureMinC: "-10", declaredTemperatureMaxC: "40",
};
const now = "2026-09-10T00:00:00.000Z";
const base = {
  evaluationId: "00000000-0000-4000-8000-000000000001", sessionId: "00000000-0000-4000-8000-000000000002",
  sessionVersion: 1, specificationRevisionId: "00000000-0000-4000-8000-000000000003", specifications: specs,
  conditions: { startTemperatureC: "20", endTemperatureC: "20.5", startedAt: now, endedAt: "2026-09-10T01:00:00.000Z", temperatureStabilityConfirmed: true },
  equipment: [{ name: "Fictional mass set", type: "Mass standards", referenceNumber: "DEMO-MS-1", suitabilityConfirmed: true }],
  inputSha256: "a".repeat(64), evaluatedAt: now,
};
const reading = (rowKey: string, loadG: string, indicationG = loadG, additionalLoadG = "4") => ({ rowKey, loadG, indicationG, additionalLoadG, changeoverConfirmed: true, observedAt: now });
const zeros = [
  { ...reading("zero-before", "0"), zeroReferenceId: "z1" },
  { ...reading("zero-after", "0"), zeroReferenceId: "z2" },
];
const confirmations = (ids: string[]) => Object.fromEntries(ids.map(id => [id, true]));

test("class III MPE uses inclusive 500e and 2000e boundaries", () => {
  assert.equal(classIIIMpeG("5000", "10", "30000"), "5");
  assert.equal(classIIIMpeG("5000.1", "10", "30000"), "10");
  assert.equal(classIIIMpeG("20000", "10", "30000"), "10");
  assert.equal(classIIIMpeG("20000.1", "10", "30000"), "15");
});

test("changeover arithmetic matches the A.4.4.3 worked example", () => {
  assert.equal(changeoverErrorG("1000", "1000", "5", "1.5"), "1");
});

function weighing(indicationG = "10000"): EvaluateSelectedInput {
  const observations: WeighingObservations = { type: "WEIGHING_INITIAL", zeroReferences: zeros,
    rows: [{ ...reading("inc", "10000", indicationG, "4"), direction: "INCREASING", zeroReferenceId: "z1" },
      { ...reading("dec", "10000", "10000", "4"), direction: "DECREASING", zeroReferenceId: "z2" }] };
  const required = ["PROGRESSIVE_LOADING_AND_UNLOADING", "CHANGEOVER_OBSERVED", "ZERO_DEVICE_STATE_RECORDED", "ZERO_OUTSIDE_AUTOMATIC_RANGE_IF_OPERATING"];
  return { ...base, observations, configuration: { code: "WEIGHING_INITIAL", increasingLoadsG: ["10000"], decreasingLoadsG: ["10000"],
    sequence: [{ direction: "INCREASING", loadG: "10000" }, { direction: "DECREASING", loadG: "10000" }],
    zeroReferences: [{ when: "BEFORE_LOADING", kind: "ZERO_OR_NEAR_ZERO" }, { when: "AFTER_UNLOADING", kind: "ZERO_OR_NEAR_ZERO" }],
    deviceRequirement: "RECORD_STATE_AND_DETERMINE_ZERO_OUTSIDE_AUTOMATIC_RANGE_IF_OPERATING" }, requiredConfirmations: required, procedureConfirmations: confirmations(required) };
}

test("weighing PASS, exact boundary PASS, and over-boundary FAIL", () => {
  assert.equal(evaluateSelectedTest(weighing()).outcome, "PASS");
  assert.equal(evaluateSelectedTest(weighing("10010")).outcome, "PASS");
  assert.equal(evaluateSelectedTest(weighing("10020")).outcome, "FAIL");
});

test("missing procedure confirmation cannot pass", () => {
  const input = weighing();
  input.procedureConfirmations.PROGRESSIVE_LOADING_AND_UNLOADING = false;
  assert.equal(evaluateSelectedTest(input).outcome, "INVALID");
});

test("malformed required observations return INCOMPLETE without throwing", () => {
  const input = weighing();
  input.observations = { type: "WEIGHING_INITIAL" } as never;
  assert.equal(evaluateSelectedTest(input).outcome, "INCOMPLETE");
});

test("four-position eccentricity evaluates from its own zero references", () => {
  const zeroReferences = [1,2,3,4].map(segment => ({ ...reading(`ez${segment}`, "0"), zeroReferenceId: `ez${segment}` }));
  const observations: EccentricityObservations = { type: "ECCENTRICITY_WEIGHTS", sketchAttachmentId: "00000000-0000-4000-8000-000000000099", displayPositionDescription: "Display at front",
    zeroReferences, rows: [1,2,3,4].map(segment => ({ ...reading(`e${segment}`, "10000", "10000", String(segment + 2)), segment: segment as 1|2|3|4, zeroReferenceId: `ez${segment}` })) };
  const required = ["QUARTER_SEGMENTS_LOADED_IN_TURN", "LOAD_DISTRIBUTION_RECORDED", "ZERO_DEVICES_NOT_OPERATING", "SKETCH_AND_DISPLAY_LOCATION_RECORDED"];
  const result = evaluateSelectedTest({ ...base, observations, configuration: { code: "ECCENTRICITY_WEIGHTS", loadG: "10000", segments: [1,2,3,4], sketchRequired: true, zeroBeforeEachSegment: true, deviceRequirement: "NOT_IN_OPERATION_IF_PRESENT" }, requiredConfirmations: required, procedureConfirmations: confirmations(required) });
  assert.equal(result.outcome, "PASS");
  assert.equal(result.rules.length, 4);
});

test("repeatability checks both individual errors and spread", () => {
  const mkSeries = (designation: "ABOUT_HALF_MAX"|"CLOSE_TO_MAX", loadG: string, additional: string[]) => ({ designation, loadG, loadSelectionReason: "Saved plan",
    rows: additional.map((delta, index) => ({ ...reading(`${designation}-${index}`, loadG, loadG, delta), unloadedIndicationG: "0", zeroResetPerformed: false })) });
  const observations: RepeatabilityObservations = { type: "REPEATABILITY_TYPE", series: [mkSeries("ABOUT_HALF_MAX", "15000", ["3","4","5","6","7","3","4","5","6","7"]), mkSeries("CLOSE_TO_MAX", "30000", ["3","4","5","6","7","3","4","5","6","7"])] };
  const required = ["UNLOADED_INSTRUMENT_AT_REST", "RESET_IF_ZERO_DEVIATES", "ZERO_DEVICES_OPERATING_IF_PRESENT"];
  const input: EvaluateSelectedInput = { ...base, observations, configuration: { code: "REPEATABILITY_TYPE", series: [{ designation: "ABOUT_HALF_MAX", loadG: "15000", repetitions: 10 }, { designation: "CLOSE_TO_MAX", loadG: "30000", repetitions: 10 }], unloadedReadingAfterEach: true, resetIfZeroDeviates: true, deviceRequirement: "IN_OPERATION_IF_PRESENT" }, requiredConfirmations: required, procedureConfirmations: confirmations(required) };
  assert.equal(evaluateSelectedTest(input).outcome, "PASS");
  observations.series[0].rows[0].indicationG = "15020";
  assert.equal(evaluateSelectedTest(input).outcome, "FAIL");
  observations.series[0].rows.pop();
  assert.equal(evaluateSelectedTest(input).outcome, "INCOMPLETE");
});

test("unsupported range is NOT_SUPPORTED rather than FAIL", () => {
  const input = weighing();
  input.specifications = { ...specs, rangeType: "MULTI_INTERVAL" };
  assert.equal(evaluateSelectedTest(input).outcome, "NOT_SUPPORTED");
});
