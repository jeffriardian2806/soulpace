import { ValidationError } from "@/core/errors";
import type { ReportsRepository } from "../data/reports.repository";
import type { ReportRow, ReportTargetType } from "../domain/report.types";

export class ReportsService {
  constructor(private readonly repo: ReportsRepository) {}

  async report(
    reporterId: string,
    targetType: string,
    targetId: string,
    reason?: string
  ): Promise<void> {
    if (targetType !== "post" && targetType !== "reply") {
      throw new ValidationError("Target laporan tidak valid.");
    }
    await this.repo.create({
      reporterId,
      targetType: targetType as ReportTargetType,
      targetId,
      reason,
    });
  }

  listOpen(): Promise<ReportRow[]> {
    return this.repo.listOpen();
  }

  resolve(reportId: string): Promise<void> {
    return this.repo.updateStatus(reportId, "actioned");
  }
}
