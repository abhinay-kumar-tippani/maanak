import type { InstrumentSpecifications } from "../../../contracts/domain";
import type { PlanGenerationResult, PlanIssue, PlanningTrace, SelectedTestPlan } from "../../../contracts/plans";
import { PlanDecimal as D, instrumentSpecificationsSchema, planningSpecificationSchema } from "../schemas/specifications";
import { coverageCatalogue, manualPreconditions, PLANNER_VERSION, referencesFor, RULE_SET_ID, RULE_SET_VERSION, selectedDefinitions } from "../definitions/selected";

export function validateDemoScope(input: unknown): { supported: boolean; issues: PlanIssue[] } {
  const parsed = instrumentSpecificationsSchema.safeParse(input);
  if (!parsed.success) return { supported: false, issues: [{ code: "INVALID_SPECIFICATION", message: "Explicit valid specifications are required; no missing declarations are defaulted.", references: [] }] };
  const s = parsed.data;
  const issues: PlanIssue[] = [];
  const check = (condition: boolean, code: string, message: string, rule = "R76-CLASS-III-LARGE-E") => {
    if (!condition) issues.push({ code, message, references: referencesFor(rule) });
  };
  check(s.accuracyClass === "III", "CLASS_NOT_SUPPORTED", "P0 supports declared class III only.");
  check(s.rangeType === "SINGLE_INTERVAL", "RANGE_NOT_SUPPORTED", "P0 supports a single interval only.");
  check(s.category === "COMPLETE_INSTRUMENT" && s.indication === "DIGITAL", "CATEGORY_NOT_SUPPORTED", "P0 supports complete digital instruments only.");
  check(!s.auxiliaryIndication && !s.extendedIndicationUsed && !s.isGradingInstrument, "FEATURE_NOT_SUPPORTED", "Auxiliary, extended-resolution test mode and grading instruments are outside P0.");
  const max = new D(s.maxG), min = new D(s.minG), e = new D(s.eG), d = new D(s.dG);
  check(e.eq(d), "INTERVAL_MISMATCH", "Declared e and d must be equal for this scope; neither value is overwritten.");
  check(e.gte(5), "INTERVAL_BRANCH_NOT_SUPPORTED", "P0 uses the e >= 5 g class III branch.");
  check(max.gte(e.times(500)) && max.lte(e.times(10000)) && min.gte(e.times(20)), "DECLARED_CLASS_INCONSISTENT", "Selected Table 3 branch requires 500 <= Max/e <= 10000 and Min >= 20e; no full conformity decision.");
  check(/^[125]0*$/.test(d.toFixed().replace(".", "").replace(/^0+/, "").replace(/0+$/, "")), "INTERVAL_FORM_NOT_SUPPORTED", "Declared d must have the 1, 2 or 5 times a power of ten form.", "R76-INTERVAL-FORM");
  check(s.receptor === "ORDINARY_PLATFORM" && s.supportPoints <= 4, "RECEPTOR_NOT_SUPPORTED", "Only ordinary receptors with one to four supports are selected.", "R76-ECCENTRIC-LOAD");
  check(new D(s.maximumAdditiveTareG).isZero(), "ADDITIVE_TARE_NOT_SUPPORTED", "P0 requires an explicit zero additive tare declaration.", "R76-ECCENTRIC-LOAD");
  check(max.lt(1000000), "CAPACITY_NOT_SUPPORTED", "P0 selects the Max < 1000 kg, ten-repeat branch.", "R76-REPEATABILITY-SERIES");
  check(new D(s.initialZeroSettingRangePercent).lte(20), "SUPPLEMENTARY_TEST_NOT_SUPPORTED", "Initial zero range above 20% Max requires an unimplemented supplementary test.", "R76-INITIAL-WEIGHING-PLAN");
  return { supported: issues.length === 0, issues };
}

function trace(ruleId: string, s: InstrumentSpecifications, calculationOrCondition: string, explanation: string, basis: PlanningTrace["basis"] = "SOURCE_REQUIREMENT"): PlanningTrace {
  return { ruleId, version: "1", basis, references: referencesFor(ruleId), inputs: { ...s }, calculationOrCondition, explanation };
}
export function generateTestPlan(input: unknown): PlanGenerationResult {
  const parsed = planningSpecificationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID_SPECIFICATION", issues: [{ code: "INVALID_SPECIFICATION", message: "A saved revision identity and all explicit declarations are required.", references: [] }] };
  const { id, versionNo, specifications: s } = parsed.data;
  const scope = validateDemoScope(s);
  if (!scope.supported) return { ok: false, code: "NOT_SUPPORTED", issues: scope.issues };
  const max = new D(s.maxG), min = new D(s.minG), e = new D(s.eG);
  const unresolved = (code: string, message: string, rule: string): PlanGenerationResult => ({ ok: false, code: "UNRESOLVED_PLAN", issues: [{ code, message, references: referencesFor(rule) }] });
  // Division by 3 terminates only if the finite decimal coefficient is divisible by 3.
  // Do not let decimal.js precision silently supply an approximate physical target.
  const total = max.plus(s.maximumAdditiveTareG);
  if (!new D(total.toFixed().replace(".", "")).mod(3).isZero()) {
    return unresolved("ECCENTRIC_LOAD_NOT_EXACT", "The one-third load has no finite decimal representation. A source-backed target/weight resolution decision is required; no rounding is implemented.", "R76-ECCENTRIC-LOAD");
  }
  const loads = new Map<string, string>();
  const add = (load: InstanceType<typeof D>) => { if (load.gt(0) && load.gte(min) && load.lte(max)) loads.set(load.toFixed(), load.toFixed()); };
  add(min); add(max);
  for (const band of [500, 2000]) { add(e.times(band)); add(e.times(band).plus(e)); }
  const demo = max.eq(30000) && min.eq(200) && e.eq(10) && new D(s.dG).eq(10);
  if (demo) {
    // Blueprint section 8's explicit fixture plan differs from its general tenths policy.
    // This exact numerical profile is a versioned software choice, never used for another Max.
    for (const value of ["1000", "2500", "10000", "15000", "25000"]) add(new D(value));
  } else {
    for (let tenth = 1; tenth <= 9 && loads.size < 10; tenth++) {
      const target = max.times(tenth).div(10);
      if (target.mod(e).isZero()) add(target); // Skip off-grid optional points, never round.
    }
  }
  if (loads.size < 10) return unresolved("INSUFFICIENT_EXACT_LOADS", "The documented e-aligned tenths algorithm cannot supply ten distinct in-range loads. No alternate spacing or rounding is authorized.", "R76-INITIAL-WEIGHING-PLAN");
  const increasing = [...loads.values()].sort((a,b) => new D(a).cmp(b));
  const decreasing = [...increasing].reverse();
  const traces: PlanningTrace[] = [
    trace("R76-CLASS-III-LARGE-E", s, "e=d; e>=5 g; 500e<=Max<=10000e; Min>=20e", "Declared branch consistency only; class selection and feature exclusions are P0 software scope."),
    trace("R76-INTERVAL-FORM", s, "d = 1, 2 or 5 times 10^k", "Check the declared interval form without inferring certification."),
    trace("R76-MPE-III", s, "Class III change points at 500e and 2000e", "Only the load-band locations are used; no permissible-error or verdict calculation is performed."),
    trace("R76-INITIAL-WEIGHING-PLAN", s, "Progressive zero to Max and back; Min if >=0.1 g; >=10 distinct test loads; zero range<=20%", "The chosen P0 branch excludes the supplementary initial-zero test."),
    trace("R76-INITIAL-WEIGHING-PLAN", s, demo ? "Explicit DEMO-30 load list" : "Min/Max, reachable band thresholds and threshold+e, then exact e-aligned tenths until ten", "Ten positive loads plus separate zero references is conservative software policy; exact points are not prescribed by OIML.", "SOFTWARE_CHOICE"),
    trace("R76-ECCENTRIC-LOAD", s, "L=(Max+maximum additive tare)/3", "Ordinary receptor only; no fractional target rounding."),
    trace("R76-ECCENTRIC-POSITIONS", s, "Four quarter segments; numbered sketch; zero devices not operating", "Capture zero before every segment in accordance with Form 3.1; preserve actual device state and distribution."),
    trace("R76-REPEATABILITY-SERIES", s, "Two series about 50% and close to 100% Max; ten readings each for Max<1000 kg", "Record loaded/unloaded readings, reset on zero deviation; zero devices operate if present."),
    trace("R76-REPEATABILITY-SERIES", s, "Selected loads exactly Max/2 and Max", "Exact half and full capacity are P0 software choices within the procedure.", "SOFTWARE_CHOICE"),
    trace("R76-GENERAL-CONDITIONS", s, "Manual review: extreme temperature difference <= min(declared span/5, 5 C); rate <=5 C/hour; setup, power, leveling, preload and recovery", "Preconditions remain NOT_VERIFIED until actual evidence is recorded; this stage performs no environmental evaluation."),
  ];
  const plan: SelectedTestPlan = {
    schemaVersion: "1", specificationRevisionId: id, specificationVersion: versionNo, specifications: s,
    ruleSetId: RULE_SET_ID, ruleSetVersion: RULE_SET_VERSION, plannerVersion: PLANNER_VERSION,
    selectionPolicy: demo ? "DEMO_30_DOCUMENTED" : "E_ALIGNED_TENTHS",
    items: [
      { definition: selectedDefinitions[0], configuration: { code: "WEIGHING_INITIAL", increasingLoadsG: increasing, decreasingLoadsG: decreasing,
        sequence: [{ direction: "INCREASING", loadG: "0" }, ...increasing.map(loadG => ({ direction: "INCREASING" as const, loadG })), ...decreasing.map(loadG => ({ direction: "DECREASING" as const, loadG })), { direction: "DECREASING", loadG: "0" }],
        zeroReferences: [{ when: "BEFORE_LOADING", kind: "ZERO_OR_NEAR_ZERO" }, { when: "AFTER_UNLOADING", kind: "ZERO_OR_NEAR_ZERO" }],
        deviceRequirement: "RECORD_STATE_AND_DETERMINE_ZERO_OUTSIDE_AUTOMATIC_RANGE_IF_OPERATING" } },
      { definition: selectedDefinitions[1], configuration: { code: "ECCENTRICITY_WEIGHTS", loadG: total.div(3).toFixed(), segments: [1,2,3,4], sketchRequired: true, zeroBeforeEachSegment: true, deviceRequirement: "NOT_IN_OPERATION_IF_PRESENT" } },
      { definition: selectedDefinitions[2], configuration: { code: "REPEATABILITY_TYPE", series: [{ designation: "ABOUT_HALF_MAX", loadG: max.div(2).toFixed(), repetitions: 10 }, { designation: "CLOSE_TO_MAX", loadG: max.toFixed(), repetitions: 10 }], unloadedReadingAfterEach: true, resetIfZeroDeviates: true, deviceRequirement: "IN_OPERATION_IF_PRESENT" } },
    ],
    manualPreconditions: manualPreconditions(), traces, references: traces.flatMap(t => t.references).concat(selectedDefinitions.flatMap(d => d.references)),
    coverage: coverageCatalogue(), scope: "DEMO_SELECTED_ONLY", overallConformity: "NOT_DETERMINED",
  };
  // A caller may prepare its own presentation copy; never let that mutate
  // definition metadata reused by a later request.
  return { ok: true, plan: structuredClone(plan) };
}
