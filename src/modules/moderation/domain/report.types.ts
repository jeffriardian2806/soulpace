export type ReportTarget = "post" | "reply";

export interface CreateReportInput {
  reporterId: string;
  targetType: ReportTarget;
  targetId: string;
  reason: string | null;
}
