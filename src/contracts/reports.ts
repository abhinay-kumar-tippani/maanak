import type { ActionResult, EvaluationState, ReportSnapshot } from "./domain";

export type SubmissionResult = { submissionId:string; reportId:string; reportNumber:string; versionNo:number; snapshotSha256:string; state:"UNDER_REVIEW"; evaluationVersion:number };
export type ReviewDecision = "APPROVE"|"REJECT"|"REQUEST_CORRECTION";
export type ReviewResult = { approvalEventId:string; decision:ReviewDecision; state:"APPROVED"|"REJECTED"|"CORRECTION_REQUESTED"; evaluationVersion:number };
export type ReviewQueueRow = { evaluationId:string; instrumentId:string; applicationNumber:string; designation:string; sampleIdentifier:string; submittedAt:string; submissionId:string; versionNo:number; snapshotSha256:string };
export type ReviewDetail = ReviewQueueRow & { evaluationVersion:number; state:EvaluationState; snapshot:ReportSnapshot };
export type ReportListRow = { evaluationId:string; instrumentId:string; applicationNumber:string; reportNumber:string; versionNo:number; state:EvaluationState; artifactId:string|null; artifactState:"PENDING"|"READY"|"FAILED"|null; sha256:string|null; createdAt:string };
export type IssuanceResult = { artifactId:string; evaluationState:"ISSUED"; sha256:string; byteLength:number; evaluationVersion:number };
export type AuditEventDto = { id:string; action:string; entityType:string; actorId:string|null; createdAt:string; metadata:Record<string,unknown> };
export type ReportAction<T> = (input:unknown)=>Promise<ActionResult<T>>;
