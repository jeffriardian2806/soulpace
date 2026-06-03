import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportsRepository } from "./reports.repository";
import type { CreateReportInput } from "../domain/report.types";

export class SupabaseReportsRepository implements ReportsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateReportInput): Promise<void> {
    const { error } = await this.supabase.from("reports").insert({
      reporter_id: input.reporterId,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
    });
    if (error) throw new Error(error.message);
  }
}
