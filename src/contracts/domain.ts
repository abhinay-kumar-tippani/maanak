// Shared wire contracts only. No runtime metrology code belongs in this file.
// Next.js server-only wrappers call pure, independently tested domain functions.
export type DecimalText = string;
export type TestCode = 'WEIGHING_INITIAL' | 'ECCENTRICITY_WEIGHTS' | 'REPEATABILITY_TYPE';
export type Outcome = 'PASS' | 'FAIL' | 'INCOMPLETE' | 'INVALID' |
  'NOT_APPLICABLE' | 'NOT_VERIFIED' | 'NOT_SUPPORTED';
export type EvaluationState = 'DRAFT' | 'PLANNED' | 'TESTING' |
  'READY_FOR_REVIEW' | 'UNDER_REVIEW' | 'CORRECTION_REQUESTED' |
  'APPROVED' | 'REJECTED' | 'ISSUED' | 'ARCHIVED';
export type Coverage = 'REQUIRED' | 'NOT_APPLICABLE' | 'NOT_IMPLEMENTED' | 'UNVERIFIED';
export interface SourceReference {
  documentId: string;
  standard: string;
  edition: string;
  documentSha256: string;
  clause: string;
  printedPages: number[];
  pdfPages: number[]; // One-based PDF page number; separate from report pagination.
  tableOrForm?: string;
}
export interface InstrumentSpecifications {
  accuracyClass: 'I' | 'II' | 'III' | 'IIII'; // Declared class, not inferred certification.
  maxG: DecimalText;
  minG: DecimalText;
  eG: DecimalText;
  dG: DecimalText;
  rangeType: 'SINGLE_INTERVAL' | 'MULTI_INTERVAL' | 'MULTIPLE_RANGE';
  category: 'COMPLETE_INSTRUMENT' | 'MODULE';
  indication: 'DIGITAL' | 'ANALOG' | 'NON_SELF_INDICATING';
  auxiliaryIndication: boolean;
  extendedIndicationUsed: boolean;
  isGradingInstrument: boolean;
  receptor: 'ORDINARY_PLATFORM' | 'SPECIAL' | 'ROLLING_LOAD';
  supportPoints: number;
  maximumAdditiveTareG: DecimalText;
  initialZeroSettingRangePercent: DecimalText;
  automaticZeroSettingExists: boolean;
  zeroTrackingExists: boolean;
  declaredTemperatureMinC: DecimalText;
  declaredTemperatureMaxC: DecimalText;
}
export interface ChangeoverReading {
  rowKey: string;
  loadG: DecimalText;
  indicationG: DecimalText;
  additionalLoadG: DecimalText;
  changeoverConfirmed: boolean;
  observedAt: string;
}
export interface ZeroReference extends ChangeoverReading {
  zeroReferenceId: string;
}
export interface WeighingObservations {
  type: 'WEIGHING_INITIAL';
  zeroReferences: ZeroReference[];
  rows: (ChangeoverReading & {
    direction: 'INCREASING' | 'DECREASING';
    zeroReferenceId: string;
  })[];
}
export interface EccentricityObservations {
  type: 'ECCENTRICITY_WEIGHTS';
  sketchAttachmentId: string;
  displayPositionDescription: string;
  zeroReferences: ZeroReference[];
  rows: (ChangeoverReading & {
    segment: 1 | 2 | 3 | 4;
    zeroReferenceId: string;
  })[];
}
export interface RepeatabilityObservations {
  type: 'REPEATABILITY_TYPE';
  series: {
    designation: 'ABOUT_HALF_MAX' | 'CLOSE_TO_MAX';
    loadG: DecimalText;
    loadSelectionReason: string;
    rows: (ChangeoverReading & {
      unloadedIndicationG: DecimalText;
      zeroResetPerformed: boolean;
    })[];
  }[];
}
export type Observations = WeighingObservations | EccentricityObservations | RepeatabilityObservations;
export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
  source: 'INPUT' | 'DOMAIN' | 'WORKFLOW' | 'STANDARD';
  references: SourceReference[];
}
export interface RuleEvaluation {
  ruleId: string;
  ruleVersion: string;
  testId: string;
  testName: string;
  verificationStatus: 'VERIFIED_SCOPED' | 'NOT_VERIFIED';
  references: SourceReference[];
  inputValues: Record<string, DecimalText | string | boolean>;
  calculatedValues: Record<string, DecimalText>;
  permissibleLimits: Record<string, DecimalText>;
  units: Record<string, string>;
  calculation: string;
  expectedCondition: string;
  result: Outcome;
  reason: string;
}
export interface EvaluationEnvelope {
  schemaVersion: '1';
  evaluationId: string;
  sessionId: string;
  sessionVersion: number;
  specificationRevisionId: string;
  ruleSetVersion: string;
  engineVersion: string;
  inputSha256: string;
  evaluatedAt: string; // Injected by service, not Date.now() inside pure calculation.
  rules: RuleEvaluation[];
  issues: ValidationIssue[];
  outcome: Outcome;
  coverage: 'DEMO_SELECTED_ONLY';
  overallConformity: 'NOT_DETERMINED';
}
export type ActionResult<T> =
  | { ok: true; data: T; version: number }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string,string> } };
export interface EvaluateTestInput {
  evaluationId: string;
  sessionId: string;
  expectedSessionVersion: number;
  // Inputs/limits/outcome/actor/role are deliberately NOT accepted here.
  // Server loads saved observations/specifications and resolves authenticated user.
}
export interface ReportSnapshot {
  schemaVersion: '1';
  reportId: string;
  reportNumber: string;
  versionNo: number;
  kind: 'SUBMITTED' | 'FINAL';
  generatedAt: string;
  applicationNumber: string;
  laboratory: { name: string; address: string };
  applicant: { name: string; address: string };
  manufacturer: { name: string; address: string };
  instrument: { designation: string; sampleIdentifier: string; serialNumber: string | null };
  specifications: InstrumentSpecifications;
  testData: { observations: Observations; evaluation: EvaluationEnvelope }[];
  coverage: { code: string; status: Coverage; explanation: string; references: SourceReference[] }[];
  testEquipment: Record<string, unknown>[];
  conditions: Record<string, unknown>[];
  evidence: { attachmentId: string; sha256: string; description: string }[];
  scopeStatement: 'Demonstration only - selected tests; full type conformity not determined.';
  overallConformity: 'NOT_DETERMINED';
  approval: null | {
    actorId: string; displayName: string; decidedAt: string;
    submissionVersionId: string; submissionSha256: string; comment: string | null;
  };
}
