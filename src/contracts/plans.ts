import type { Coverage, InstrumentSpecifications, SourceReference, TestCode } from "./domain";

export type CreateTestPlanInput = { evaluationId: string; expectedRowVersion: number };
export type PlanIssue = { code: string; message: string; references: SourceReference[] };
export type PlanningTrace = {
  ruleId: string; version: string; basis: "SOURCE_REQUIREMENT" | "SOFTWARE_CHOICE";
  references: SourceReference[]; inputs: Record<string, string | boolean | number>;
  calculationOrCondition: string; explanation: string;
};
export type ManualPrecondition = {
  id: string; description: string; status: "NOT_VERIFIED"; references: SourceReference[];
};
export type DefinitionMetadata = {
  id: string; code: TestCode; version: string; name: string;
  evaluatorId: string; evaluatorStatus: "NOT_IMPLEMENTED";
  references: SourceReference[]; requiredReadings: string[]; procedureConfirmations: string[];
};
export type WeighingConfiguration = {
  code: "WEIGHING_INITIAL"; increasingLoadsG: string[]; decreasingLoadsG: string[];
  sequence: { direction: "INCREASING" | "DECREASING"; loadG: string }[];
  zeroReferences: { when: "BEFORE_LOADING" | "AFTER_UNLOADING"; kind: "ZERO_OR_NEAR_ZERO" }[];
  deviceRequirement: "RECORD_STATE_AND_DETERMINE_ZERO_OUTSIDE_AUTOMATIC_RANGE_IF_OPERATING";
};
export type EccentricityConfiguration = {
  code: "ECCENTRICITY_WEIGHTS"; loadG: string; segments: [1, 2, 3, 4];
  sketchRequired: true; zeroBeforeEachSegment: true; deviceRequirement: "NOT_IN_OPERATION_IF_PRESENT";
};
export type RepeatabilityConfiguration = {
  code: "REPEATABILITY_TYPE";
  series: { designation: "ABOUT_HALF_MAX" | "CLOSE_TO_MAX"; loadG: string; repetitions: 10 }[];
  unloadedReadingAfterEach: true; resetIfZeroDeviates: true; deviceRequirement: "IN_OPERATION_IF_PRESENT";
};
export type PlanConfiguration = WeighingConfiguration | EccentricityConfiguration | RepeatabilityConfiguration;
export type PlanItem = { definition: DefinitionMetadata; configuration: PlanConfiguration };
export type CoverageEntry = {
  code: string; name: string; status: Coverage; explanation: string; references: SourceReference[];
};
export type SelectedTestPlan = {
  schemaVersion: "1"; specificationRevisionId: string; specificationVersion: number;
  specifications: InstrumentSpecifications; ruleSetId: string; ruleSetVersion: string;
  plannerVersion: string; selectionPolicy: "DEMO_30_DOCUMENTED" | "E_ALIGNED_TENTHS";
  items: PlanItem[]; manualPreconditions: ManualPrecondition[];
  traces: PlanningTrace[]; references: SourceReference[]; coverage: CoverageEntry[];
  scope: "DEMO_SELECTED_ONLY"; overallConformity: "NOT_DETERMINED";
};
export type PlanGenerationResult =
  | { ok: true; plan: SelectedTestPlan }
  | { ok: false; code: "INVALID_SPECIFICATION" | "NOT_SUPPORTED" | "UNRESOLVED_PLAN"; issues: PlanIssue[] };
export type SavedTestPlan = {
  id: string; evaluationId: string; versionNo: number; createdAt: string; createdBy: string;
  plan: SelectedTestPlan;
};
