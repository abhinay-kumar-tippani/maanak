export type DashboardMetricCounts = {
  evaluationsInProgress: number;
  evaluationsAwaitingReview: number;
  approvedEvaluations: number;
  issuedReports: number;
  failedCurrentTestResults: number;
};

export type DashboardAuditEvent = {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  evaluationId: string | null;
  actorId: string | null;
  createdAt: string;
};

export type DashboardData = {
  metrics: DashboardMetricCounts;
  recentAuditEvents: DashboardAuditEvent[];
  activityState: "EMPTY" | "AVAILABLE";
};
