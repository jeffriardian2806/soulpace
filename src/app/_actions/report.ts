"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReportsService } from "@/modules/reports";

// Dipakai di feed (laporkan post) dan halaman detail (laporkan reply).
export async function createReportAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const targetType = String(formData.get("target_type"));
  const targetId = String(formData.get("target_id"));

  const svc = await getReportsService();
  await svc.report(user.id, targetType, targetId);
}
