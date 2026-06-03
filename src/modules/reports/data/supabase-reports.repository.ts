import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportsRepository } from "./reports.repository";
import type { CreateReportInput, ReportRow } from "../domain/report.types";

export class SupabaseReportsRepository implements ReportsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateReportInput): Promise<void> {
    const { error } = await this.supabase.from("reports").insert({
      reporter_id: input.reporterId,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason ?? null,
    });
    if (error) throw new Error(error.message);
  }

  async listOpen(): Promise<ReportRow[]> {
    const { data, error } = await this.supabase
      .from("reports")
      .select("id, target_type, target_id, reason, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      createdAt: r.created_at,
    }));
  }

  async updateStatus(
    reportId: string,
    status: "reviewed" | "actioned"
  ): Promise<void> {
    const { error } = await this.supabase
      .from("reports")
      .update({ status })
      .eq("id", reportId);
    if (error) throw new Error(error.message);
  }
}
