import { createClient } from "@/lib/supabase/server";
import { SupabaseReportsRepository } from "./data/supabase-reports.repository";
import { ReportsService } from "./services/reports.service";

export async function getReportsService(): Promise<ReportsService> {
  const supabase = await createClient();
  const repo = new SupabaseReportsRepository(supabase);
  return new ReportsService(repo);
}
