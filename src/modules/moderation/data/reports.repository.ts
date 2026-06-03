import type { CreateReportInput } from "../domain/report.types";

export interface ReportsRepository {
  create(input: CreateReportInput): Promise<void>;
}
