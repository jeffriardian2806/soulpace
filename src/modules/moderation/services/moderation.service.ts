import { ValidationError } from "@/core/errors";
import type { ReportsRepository } from "../data/reports.repository";
import type { ReportTarget } from "../domain/report.types";

const VALID_TARGETS: ReportTarget[] = ["post", "reply"];

export class ModerationService {
  constructor(private readonly repo: ReportsRepository) {}

  async report(
    reporterId: string,
    targetType: string,
    targetId: string,
    reason: string
  ): Promise<void> {
    if (!VALID_TARGETS.includes(targetType as ReportTarget)) {
      throw new ValidationError("Target laporan tidak valid.");
    }
    if (!targetId) {
      throw new ValidationError("Target laporan tidak ditemukan.");
    }
    await this.repo.create({
      reporterId,
      targetType: targetType as ReportTarget,
      targetId,
      reason: reason.trim() || null,
    });
  }
}
