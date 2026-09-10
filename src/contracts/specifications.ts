export type AccuracyClass = "I" | "II" | "III" | "IIII";
export type RangeType = "SINGLE_INTERVAL" | "MULTI_INTERVAL" | "MULTIPLE_RANGE";
export type IndicationType = "DIGITAL" | "ANALOG" | "NON_SELF_INDICATING";
export type ReceptorType = "ORDINARY_PLATFORM" | "SPECIAL" | "ROLLING_LOAD";
export type InstrumentCategory = "COMPLETE_INSTRUMENT" | "MODULE";
export type ManualCheckStatus = "CONFIRMED" | "NOT_CONFIRMED" | "NOT_VERIFIED";

export type ManualIntakeChecks = {
  documentReview: ManualCheckStatus;
  markings: ManualCheckStatus;
  sealing: ManualCheckStatus;
  environment: ManualCheckStatus;
  notes: string | null;
};

export type SpecificationInput = {
  accuracyClass: AccuracyClass;
  maxG: string;
  minG: string;
  eG: string;
  dG: string;
  rangeType: RangeType;
  category: InstrumentCategory;
  indication: IndicationType;
  auxiliaryIndication: boolean;
  extendedIndicationUsed: boolean;
  isGradingInstrument: boolean;
  receptor: ReceptorType;
  supportPoints: number;
  maximumAdditiveTareG: string;
  initialZeroSettingRangePercent: string;
  automaticZeroSettingExists: boolean;
  zeroTrackingExists: boolean;
  declaredTemperatureMinC: string;
  declaredTemperatureMaxC: string;
  manualIntake: ManualIntakeChecks;
};

export type SaveSpecificationInput = SpecificationInput & {
  evaluationId: string;
  expectedRowVersion: number;
};

export type SpecificationRevision = SpecificationInput & {
  id: string;
  evaluationId: string;
  versionNo: number;
  recordedBy: string;
  createdAt: string;
  resultingEvaluationState: "DRAFT";
  resultingRowVersion: number;
};
