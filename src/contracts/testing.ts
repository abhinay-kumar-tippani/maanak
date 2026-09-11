import type {
  ActionResult,
  EvaluationEnvelope,
  EvaluationState,
  Observations,
  Outcome,
  TestCode,
} from "./domain";

export type TestConditions = {
  startTemperatureC: string | null;
  endTemperatureC: string | null;
  startedAt: string;
  endedAt: string;
  temperatureStabilityConfirmed: boolean;
};

export type EquipmentRecord = {
  name: string;
  type: string;
  referenceNumber: string;
  suitabilityConfirmed: boolean;
  note?: string;
};

export type SaveObservationsInput = {
  evaluationId: string;
  planItemId: string;
  sessionId?: string;
  expectedEvaluationVersion: number;
  expectedSessionVersion: number;
  observations: Observations;
  conditions: TestConditions;
  equipment: EquipmentRecord[];
  procedureConfirmations: Record<string, boolean>;
  remarks?: string;
};

export type TestSessionDto = {
  id: string;
  evaluationId: string;
  planItemId: string;
  testCode: TestCode;
  attemptNo: number;
  state: "DRAFT" | "COMPLETED";
  rowVersion: number;
  observations: Observations | null;
  conditions: TestConditions;
  equipment: EquipmentRecord[];
  procedureConfirmations: Record<string, boolean>;
  remarks: string | null;
  retestReason: string | null;
  result: EvaluationEnvelope | null;
  resultOutcome: Outcome | null;
  completedAt: string | null;
};

export type EvaluationWorkspace = {
  evaluationId: string;
  instrumentId: string;
  applicationNumber: string;
  state: EvaluationState;
  rowVersion: number;
  planId: string;
  specificationId: string;
  items: { id: string; code: TestCode; name: string; configuration: unknown; session: TestSessionDto | null }[];
};

export type SaveObservationsResult = { sessionId: string; sessionVersion: number; evaluationVersion: number };
export type EvaluateResult = { sessionId: string; sessionVersion: number; evaluation: EvaluationEnvelope };
export type CompletionResult = { sessionId: string; outcome: "PASS" | "FAIL"; evaluationVersion: number };
export type RetestResult = { sessionId: string; attemptNo: number; evaluationVersion: number };
export type ReadyResult = { evaluationId: string; state: "READY_FOR_REVIEW"; evaluationVersion: number };

export type TestingAction<T> = (input: unknown) => Promise<ActionResult<T>>;
