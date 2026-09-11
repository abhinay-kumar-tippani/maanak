import type { SourceReference, TestCode } from "../../../contracts/domain";
import type { DefinitionMetadata, CoverageEntry, ManualPrecondition } from "../../../contracts/plans";
import registry from "../../../../docs/rule-registry.json";
import catalogue from "../../../../docs/test-catalogue.json";
import manifest from "../../../../docs/source-manifest.json";
import { weighingSchema, eccentricitySchema, repeatabilitySchema } from "../schemas/observations";

export const RULE_SET_ID = "r76-2006-2007-demo-classiii-plan-v1";
export const RULE_SET_VERSION = "selected-demo-plan-1";
export const PLANNER_VERSION = "1";
export function referencesFor(ruleId: string): SourceReference[] {
  const rule = registry.rules.find(r => r.ruleId === ruleId);
  if (!rule) throw new Error("NOT VERIFIED FROM PROVIDED AUTHORITATIVE SOURCE");
  return rule.references.map(r => ({ ...r, tableOrForm: r.tableOrForm ?? undefined }));
}
export function formReference(form: string, pages: number[]): SourceReference {
  const source = manifest.sources.find(s => s.id === "r76-2")!;
  return { documentId: source.id, standard: "OIML R 76-2", edition: "2007", documentSha256: source.sha256,
    clause: form, printedPages: pages, pdfPages: pages, tableOrForm: `Form ${form}` };
}
export const observationSchemas = {
  WEIGHING_INITIAL: weighingSchema, ECCENTRICITY_WEIGHTS: eccentricitySchema, REPEATABILITY_TYPE: repeatabilitySchema,
};
function definition(code: TestCode, name: string, refs: SourceReference[], readings: string[], confirmations: string[]): DefinitionMetadata {
  return { id: `${RULE_SET_ID}:${code}:1`, code, version: "1", name,
    evaluatorId: `${code.toLowerCase()}-v1`, evaluatorStatus: "NOT_IMPLEMENTED",
    references: refs, requiredReadings: readings, procedureConfirmations: confirmations };
}
export const selectedDefinitions: DefinitionMetadata[] = [
  definition("WEIGHING_INITIAL", "Initial weighing performance", [
    ...referencesFor("R76-INITIAL-WEIGHING-PLAN"), ...referencesFor("R76-MPE-III"),
    ...referencesFor("R76-CHANGEOVER"), formReference("1", [10]),
  ], ["Actual load, indication and additional load to observed changeover in each direction", "Separate zero/near-zero observations before loading and after unloading"],
  ["PROGRESSIVE_LOADING_AND_UNLOADING", "CHANGEOVER_OBSERVED", "ZERO_DEVICE_STATE_RECORDED", "ZERO_OUTSIDE_AUTOMATIC_RANGE_IF_OPERATING"]),
  definition("ECCENTRICITY_WEIGHTS", "Eccentricity using weights, ordinary receptor", [
    ...referencesFor("R76-ECCENTRIC-LOAD"), ...referencesFor("R76-ECCENTRIC-POSITIONS"),
  ], ["Four quarter-segment load/indication/changeover readings", "Zero/near-zero before each segment", "Numbered sketch with display location"],
  ["QUARTER_SEGMENTS_LOADED_IN_TURN", "LOAD_DISTRIBUTION_RECORDED", "ZERO_DEVICES_NOT_OPERATING", "SKETCH_AND_DISPLAY_LOCATION_RECORDED"]),
  definition("REPEATABILITY_TYPE", "Type-evaluation repeatability", referencesFor("R76-REPEATABILITY-SERIES"),
  ["Ten loaded indication/changeover readings in each of two series", "Resting unloaded indication between weighings and zero-reset record"],
  ["UNLOADED_INSTRUMENT_AT_REST", "RESET_IF_ZERO_DEVIATES", "ZERO_DEVICES_OPERATING_IF_PRESENT"]),
];
export function coverageCatalogue(): CoverageEntry[] {
  return [
    ...catalogue.items.map(item => {
      const selected = ["1", "3.1", "5"].includes(item.form);
      return { code: `FORM_${item.form}`, name: item.name, status: selected ? "REQUIRED" as const : "NOT_IMPLEMENTED" as const,
        explanation: selected
          ? "Only the selected baseline procedure is planned; its evaluator is not implemented. This does not cover every branch of this form."
          : "Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.",
        references: [formReference(item.form, item.pdfPages)] };
    }),
    { code: "WEIGHING_TEMPERATURE_REPETITIONS", name: "Weighing at other temperatures", status: "NOT_IMPLEMENTED",
      explanation: "Form 1 initial baseline only. Temperature repetitions shown in the summary are not implemented.", references: [formReference("Summary; 1", [9, 10])] },
  ];
}
export function manualPreconditions(): ManualPrecondition[] {
  const descriptions = [
    ["INTAKE_REVIEW", "Review documentation, markings and sealing; record manual findings. These are not an approval certificate."],
    ["ENVIRONMENT", "Record temperature and times throughout the test. Manually confirm extreme temperature difference <= one fifth of declared span, capped at 5 C, and rate <= 5 C/hour. Two endpoints alone cannot establish continuous stability."],
    ["POWER_LEVEL_RECOVERY", "Record power supply, leveling where relevant, adjustment and sufficient recovery between tests."],
    ["PRELOAD", "Before each weighing test preload once to Max or Lim if defined; record the actual preload and procedure exceptions."],
    ["TEST_EQUIPMENT", "Identify actual weights/equipment and traceability; document manual suitability. Full R111 validation: NOT VERIFIED FROM PROVIDED AUTHORITATIVE SOURCE."],
    ["TESTER_PLAN_REVIEW", "Review generated loads and actual available weights before testing; do not substitute invented readings or silently round targets."],
  ];
  return descriptions.map(([id, description]) => ({ id, description, status: "NOT_VERIFIED",
    references: id === "TEST_EQUIPMENT" ? referencesFor("R76-TEST-EQUIPMENT")
      : id === "INTAKE_REVIEW" ? [{ ...referencesFor("R76-GENERAL-CONDITIONS")[0], clause: "A.1-A.3", printedPages: [85], pdfPages: [85] }]
      : referencesFor("R76-GENERAL-CONDITIONS") }));
}
