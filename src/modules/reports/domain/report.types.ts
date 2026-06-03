export type ReportTargetType = "post" | "reply";

export interface CreateReportInput {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason?: string;
}

export interface ReportRow {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string | null;
  createdAt: string;
}
