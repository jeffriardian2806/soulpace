"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getModerationService } from "@/modules/moderation";
import { DomainError } from "@/core/errors";

export type ReportState = { ok: boolean; error: string | null };

export async function reportAction(
  _prev: ReportState,
  formData: FormData
): Promise<ReportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const targetType = String(formData.get("target_type"));
  const targetId = String(formData.get("target_id"));
  const reason = String(formData.get("reason") ?? "");

  try {
    const svc = await getModerationService();
    await svc.report(user.id, targetType, targetId, reason);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof DomainError ? e.message : "Gagal melaporkan.",
    };
  }
  return { ok: true, error: null };
}
