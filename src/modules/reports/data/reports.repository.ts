import type { CreateReportInput, ReportRow } from "../domain/report.types";

export interface ReportsRepository {
  create(input: CreateReportInput): Promise<void>;
  listOpen(): Promise<ReportRow[]>;
  updateStatus(reportId: string, status: "reviewed" | "actioned"): Promise<void>;
}
