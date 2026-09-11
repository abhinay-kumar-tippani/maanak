import Decimal from "decimal.js";
import type {
  EccentricityObservations,
  EvaluationEnvelope,
  InstrumentSpecifications,
  Observations,
  Outcome,
  RepeatabilityObservations,
  RuleEvaluation,
  SourceReference,
  TestCode,
  ValidationIssue,
  WeighingObservations,
  ZeroReference,
} from "../../../contracts/domain";
import type { EquipmentRecord, TestConditions } from "../../../contracts/testing";
import type { PlanConfiguration } from "../../../contracts/plans";
import { referencesFor, RULE_SET_VERSION } from "../definitions/selected";
import { observationSchemas } from "../definitions/selected";
import { validateDemoScope } from "../plans/generate";

export const ENGINE_VERSION = "selected-demo-engine-1";

export type EvaluateSelectedInput = {
  evaluationId: string;
  sessionId: string;
  sessionVersion: number;
  specificationRevisionId: string;
  specifications: InstrumentSpecifications;
  configuration: PlanConfiguration;
  observations: Observations;
  conditions: TestConditions;
  equipment: EquipmentRecord[];
  procedureConfirmations: Record<string, boolean>;
  requiredConfirmations: string[];
  inputSha256: string;
  evaluatedAt: string;
};

const fmt = (value: Decimal.Value) => new Decimal(value).toFixed();
const absLte = (value: Decimal, limit: Decimal) => value.abs().lte(limit);

function sourceIssue(code: string, message: string, references: SourceReference[], source: ValidationIssue["source"] = "DOMAIN"): ValidationIssue {
  return { code, path: "observations", message, source, references };
}

export function classIIIMpeG(loadG: string, eG: string, maxG: string): string {
  const load = new Decimal(loadG), e = new Decimal(eG), max = new Decimal(maxG);
  if (!load.isFinite() || load.lt(0) || load.gt(max) || !e.isFinite() || e.lte(0)) throw new Error("LOAD_OUT_OF_RANGE");
  const q = load.div(e);
  if (q.lte(500)) return fmt(e.div(2));
  if (q.lte(2000)) return fmt(e);
  if (q.lte(10000)) return fmt(e.times(1.5));
  throw new Error("NOT_SUPPORTED");
}

export function changeoverErrorG(loadG: string, indicationG: string, eG: string, additionalLoadG: string): string {
  return fmt(new Decimal(indicationG).plus(new Decimal(eG).div(2)).minus(additionalLoadG).minus(loadG));
}

function zeroError(zero: ZeroReference, eG: string): Decimal {
  return new Decimal(changeoverErrorG(zero.loadG, zero.indicationG, eG, zero.additionalLoadG));
}

function rule(args: Omit<RuleEvaluation, "ruleVersion" | "verificationStatus">): RuleEvaluation {
  return { ...args, ruleVersion: "1", verificationStatus: "VERIFIED_SCOPED" };
}

function requirements(input: EvaluateSelectedInput): ValidationIssue[] {
  const refs = referencesFor("R76-GENERAL-CONDITIONS");
  const issues: ValidationIssue[] = [];
  if (!input.conditions?.startedAt || !input.conditions?.endedAt || !input.conditions?.startTemperatureC || !input.conditions?.endTemperatureC)
    issues.push(sourceIssue("CONDITIONS_REQUIRED", "Start/end temperature and time are required.", refs, "INPUT"));
  if (!input.conditions?.temperatureStabilityConfirmed)
    issues.push(sourceIssue("STABILITY_NOT_CONFIRMED", "Temperature stability must be manually confirmed; endpoints alone do not establish stability.", refs, "INPUT"));
  if (!input.equipment?.length || input.equipment.some(item => !item.name || !item.referenceNumber || !item.suitabilityConfirmed))
    issues.push(sourceIssue("EQUIPMENT_REQUIRED", "Record equipment identity and manually confirm suitability.", referencesFor("R76-TEST-EQUIPMENT"), "INPUT"));
  for (const id of input.requiredConfirmations) if (input.procedureConfirmations?.[id] !== true)
    issues.push(sourceIssue("PROCEDURE_NOT_CONFIRMED", `Required procedure confirmation is missing or negative: ${id}.`, refs, input.procedureConfirmations?.[id] === false ? "WORKFLOW" : "INPUT"));
  return issues;
}

function plannedShapeIssues(input: EvaluateSelectedInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const bad = (code: string, message: string, ruleId: string) => issues.push(sourceIssue(code, message, referencesFor(ruleId), "WORKFLOW"));
  const observations = input.observations;
  const configuration = input.configuration;
  if (configuration.code !== observations.type) {
    bad("TEST_TYPE_MISMATCH", "The observations do not match the planned test definition.", "R76-INITIAL-WEIGHING-PLAN");
    return issues;
  }
  if (observations.type === "WEIGHING_INITIAL") {
    if (configuration.code !== "WEIGHING_INITIAL") return issues;
    const expected = configuration.sequence.filter(row => row.loadG !== "0");
    if (observations.rows.length !== expected.length) issues.push(sourceIssue("PLANNED_ROWS_INCOMPLETE", "Every planned increasing/decreasing load must be recorded.", referencesFor("R76-INITIAL-WEIGHING-PLAN"), "INPUT"));
    else if (expected.some((row, index) => {
      const actual = observations.rows[index];
      return !actual || actual.direction !== row.direction || !new Decimal(actual.loadG).eq(row.loadG);
    })) bad("PLAN_SEQUENCE_MISMATCH", "Every planned increasing/decreasing load must be recorded in order.", "R76-INITIAL-WEIGHING-PLAN");
    if (observations.zeroReferences.length < 2) issues.push(sourceIssue("ZERO_REFERENCES_REQUIRED", "Separate zero references before and after weighing are required.", referencesFor("R76-ZERO-CORRECTION"), "INPUT"));
  }
  if (observations.type === "ECCENTRICITY_WEIGHTS") {
    if (configuration.code !== "ECCENTRICITY_WEIGHTS") return issues;
    const segments = observations.rows.map(r => r.segment).sort();
    if (observations.rows.length!==4 || new Set(segments).size!==4) issues.push(sourceIssue("ECCENTRIC_ROWS_INCOMPLETE", "Exactly four segment readings are required.", referencesFor("R76-ECCENTRIC-POSITIONS"), "INPUT"));
    else if (segments.join(",") !== "1,2,3,4" || observations.rows.some(r => !new Decimal(r.loadG).eq(configuration.loadG))) bad("ECCENTRIC_PLAN_MISMATCH", "The four segment readings must use the planned load.", "R76-ECCENTRIC-POSITIONS");
    if (!observations.sketchAttachmentId || observations.sketchAttachmentId === "NOT_RECORDED" || observations.zeroReferences.length < 4)
      issues.push(sourceIssue("ECCENTRIC_EVIDENCE_REQUIRED", "A sketch and a zero reference for every segment are required.", referencesFor("R76-ECCENTRIC-POSITIONS"), "INPUT"));
  }
  if (observations.type === "REPEATABILITY_TYPE") {
    if (configuration.code !== "REPEATABILITY_TYPE") return issues;
    if (observations.series.length !== 2 || configuration.series.some(config => !observations.series.find(series => series.designation === config.designation)?.rows.length))
      issues.push(sourceIssue("REPEATABILITY_SERIES_INCOMPLETE", "Both planned series require ten readings.", referencesFor("R76-REPEATABILITY-SERIES"), "INPUT"));
    else if (configuration.series.some(config => {
      const actual = observations.series.find(series => series.designation === config.designation);
      return !actual || !new Decimal(actual.loadG).eq(config.loadG) || actual.rows.length !== config.repetitions;
    })) {
      const countWrong=configuration.series.some(config=>observations.series.find(series=>series.designation===config.designation)?.rows.length!==config.repetitions);
      if(countWrong) issues.push(sourceIssue("REPEATABILITY_SERIES_INCOMPLETE", "Both planned series require ten readings.", referencesFor("R76-REPEATABILITY-SERIES"), "INPUT"));
      else bad("REPEATABILITY_PLAN_MISMATCH", "Both series must use their planned loads.", "R76-REPEATABILITY-SERIES");
    }
  }
  return issues;
}

function evaluateWeighing(obs: WeighingObservations, specs: InstrumentSpecifications): RuleEvaluation[] {
  const zeros = new Map(obs.zeroReferences.map(z => [z.zeroReferenceId, z]));
  return obs.rows.map(row => {
    const zero = zeros.get(row.zeroReferenceId);
    const error = new Decimal(changeoverErrorG(row.loadG, row.indicationG, specs.eG, row.additionalLoadG));
    const corrected = zero ? error.minus(zeroError(zero, specs.eG)) : new Decimal(Number.NaN);
    const mpe = new Decimal(classIIIMpeG(row.loadG, specs.eG, specs.maxG));
    const result: Outcome = zero && row.changeoverConfirmed && zero.changeoverConfirmed ? (absLte(corrected, mpe) ? "PASS" : "FAIL") : "INCOMPLETE";
    return rule({ ruleId: "R76-MPE-III", testId: row.rowKey, testName: `Initial weighing ${row.direction.toLowerCase()} ${row.loadG} g`,
      references: [...referencesFor("R76-MPE-III"), ...referencesFor("R76-CHANGEOVER"), ...referencesFor("R76-ZERO-CORRECTION")],
      inputValues: { loadG: row.loadG, indicationG: row.indicationG, additionalLoadG: row.additionalLoadG, eG: specs.eG, zeroReferenceId: row.zeroReferenceId },
      calculatedValues: { errorG: fmt(error), correctedErrorG: corrected.isFinite() ? fmt(corrected) : "NaN" }, permissibleLimits: { mpeG: fmt(mpe) },
      units: { loadG: "g", indicationG: "g", additionalLoadG: "g", errorG: "g", correctedErrorG: "g", mpeG: "g" },
      calculation: "P = I + e/2 - deltaL; E = P - L; Ec = E - E0", expectedCondition: "abs(Ec) <= MPE for the class III load band.", result,
      reason: !zero ? "The referenced zero observation is missing." : result === "PASS" ? `Corrected error ${fmt(corrected)} g is within ±${fmt(mpe)} g.` : result === "FAIL" ? `Corrected error ${fmt(corrected)} g exceeds ±${fmt(mpe)} g.` : "Changeover was not confirmed." });
  });
}

function evaluateEccentricity(obs: EccentricityObservations, specs: InstrumentSpecifications): RuleEvaluation[] {
  const zeros = new Map(obs.zeroReferences.map(z => [z.zeroReferenceId, z]));
  return obs.rows.map(row => {
    const zero = zeros.get(row.zeroReferenceId);
    const error = new Decimal(changeoverErrorG(row.loadG, row.indicationG, specs.eG, row.additionalLoadG));
    const corrected = zero ? error.minus(zeroError(zero, specs.eG)) : new Decimal(Number.NaN);
    const mpe = new Decimal(classIIIMpeG(row.loadG, specs.eG, specs.maxG));
    const result: Outcome = zero && row.changeoverConfirmed && zero.changeoverConfirmed ? (absLte(corrected, mpe) ? "PASS" : "FAIL") : "INCOMPLETE";
    return rule({ ruleId: "R76-ECCENTRIC-POSITIONS", testId: row.rowKey, testName: `Eccentricity segment ${row.segment}`,
      references: [...referencesFor("R76-ECCENTRIC-POSITIONS"), ...referencesFor("R76-MPE-III"), ...referencesFor("R76-ZERO-CORRECTION")],
      inputValues: { segment: String(row.segment), loadG: row.loadG, indicationG: row.indicationG, additionalLoadG: row.additionalLoadG, zeroReferenceId: row.zeroReferenceId },
      calculatedValues: { errorG: fmt(error), correctedErrorG: corrected.isFinite() ? fmt(corrected) : "NaN" }, permissibleLimits: { mpeG: fmt(mpe) },
      units: { loadG: "g", errorG: "g", correctedErrorG: "g", mpeG: "g" }, calculation: "P = I + e/2 - deltaL; E = P - L; Ec = E - E0",
      expectedCondition: "Each segment corrected error must satisfy abs(Ec) <= MPE.", result,
      reason: !zero ? "The segment zero observation is missing." : result === "PASS" ? `Segment ${row.segment} corrected error ${fmt(corrected)} g is within ±${fmt(mpe)} g.` : result === "FAIL" ? `Segment ${row.segment} corrected error ${fmt(corrected)} g exceeds ±${fmt(mpe)} g.` : "Changeover was not confirmed." });
  });
}

function evaluateRepeatability(obs: RepeatabilityObservations, specs: InstrumentSpecifications): RuleEvaluation[] {
  return obs.series.map(series => {
    const errors = series.rows.map(row => new Decimal(changeoverErrorG(row.loadG, row.indicationG, specs.eG, row.additionalLoadG)));
    const mpe = new Decimal(classIIIMpeG(series.loadG, specs.eG, specs.maxG));
    const spread = errors.length ? Decimal.max(...errors).minus(Decimal.min(...errors)) : new Decimal(Number.NaN);
    const complete = series.rows.length === 10 && series.rows.every(row => row.changeoverConfirmed && row.unloadedIndicationG !== "");
    const individualPass = complete && errors.every(error => absLte(error, mpe));
    const spreadPass = complete && spread.lte(mpe);
    const result: Outcome = !complete ? "INCOMPLETE" : individualPass && spreadPass ? "PASS" : "FAIL";
    return rule({ ruleId: "R76-REPEATABILITY-LIMITS", testId: series.designation, testName: `Repeatability ${series.designation}`,
      references: referencesFor("R76-REPEATABILITY-LIMITS"), inputValues: { loadG: series.loadG, eG: specs.eG, readings: String(series.rows.length) },
      calculatedValues: { minimumErrorG: errors.length ? fmt(Decimal.min(...errors)) : "NaN", maximumErrorG: errors.length ? fmt(Decimal.max(...errors)) : "NaN", spreadG: spread.isFinite() ? fmt(spread) : "NaN" },
      permissibleLimits: { individualMpeG: fmt(mpe), maximumSpreadG: fmt(mpe) }, units: { loadG: "g", minimumErrorG: "g", maximumErrorG: "g", spreadG: "g", individualMpeG: "g", maximumSpreadG: "g" },
      calculation: "E_i = I_i + e/2 - deltaL_i - L; spread = max(E_i) - min(E_i)", expectedCondition: "Every abs(E_i) <= MPE and spread <= MPE.", result,
      reason: !complete ? "Ten loaded readings with unload records are required." : result === "PASS" ? `All individual errors and spread ${fmt(spread)} g are within ${fmt(mpe)} g.` : `Individual error or spread ${fmt(spread)} g exceeds ${fmt(mpe)} g.` });
  });
}

export function evaluateSelectedTest(input: EvaluateSelectedInput): EvaluationEnvelope {
  const scope = validateDemoScope(input.specifications);
  const schema = observationSchemas[input.observations?.type as TestCode];
  const issues: ValidationIssue[] = [];
  if (!scope.supported) issues.push(...scope.issues.map(i => sourceIssue(i.code, i.message, i.references, "DOMAIN")));
  const structurallyValid = Boolean(schema?.safeParse(input.observations).success);
  if (!structurallyValid) issues.push(sourceIssue("OBSERVATIONS_INVALID", "Required observation fields are missing or malformed.", [], "INPUT"));
  issues.push(...requirements(input));
  if (structurallyValid) issues.push(...plannedShapeIssues(input));
  let rules: RuleEvaluation[] = [];
  if (scope.supported && structurallyValid) {
    if (input.observations.type === "WEIGHING_INITIAL") rules = evaluateWeighing(input.observations, input.specifications);
    if (input.observations.type === "ECCENTRICITY_WEIGHTS") rules = evaluateEccentricity(input.observations, input.specifications);
    if (input.observations.type === "REPEATABILITY_TYPE") rules = evaluateRepeatability(input.observations, input.specifications);
  }
  const outcome: Outcome = !scope.supported ? "NOT_SUPPORTED" : issues.some(i => i.code === "OBSERVATIONS_INVALID" || i.source === "INPUT") ? "INCOMPLETE"
    : issues.some(i => i.source === "WORKFLOW") || rules.some(r => r.result === "INVALID") ? "INVALID" : rules.some(r => r.result === "INCOMPLETE") ? "INCOMPLETE"
      : rules.some(r => r.result === "FAIL") ? "FAIL" : rules.length > 0 && rules.every(r => r.result === "PASS") ? "PASS" : "NOT_VERIFIED";
  return { schemaVersion: "1", evaluationId: input.evaluationId, sessionId: input.sessionId, sessionVersion: input.sessionVersion,
    specificationRevisionId: input.specificationRevisionId, ruleSetVersion: RULE_SET_VERSION, engineVersion: ENGINE_VERSION,
    inputSha256: input.inputSha256, evaluatedAt: input.evaluatedAt, rules, issues, outcome, coverage: "DEMO_SELECTED_ONLY", overallConformity: "NOT_DETERMINED" };
}
