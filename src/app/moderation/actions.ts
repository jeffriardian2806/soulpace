"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfilesService } from "@/modules/profiles";
import { getPostsService } from "@/modules/posts";
import { getRepliesService } from "@/modules/replies";
import { getReportsService } from "@/modules/reports";

async function requireModerator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profiles = await getProfilesService();
  const profile = await profiles.getProfile(user.id);
  if (profile?.role !== "moderator") redirect("/feed");
}

export async function takedownAction(formData: FormData): Promise<void> {
  await requireModerator();
  const targetType = String(formData.get("target_type"));
  const targetId = String(formData.get("target_id"));
  const reportId = String(formData.get("report_id"));

  if (targetType === "post") {
    const posts = await getPostsService();
    await posts.setStatus(targetId, "removed");
  } else if (targetType === "reply") {
    const replies = await getRepliesService();
    await replies.setStatus(targetId, "removed");
  }
  const reports = await getReportsService();
  await reports.resolve(reportId);
  revalidatePath("/moderation");
}

export async function dismissAction(formData: FormData): Promise<void> {
  await requireModerator();
  const reportId = String(formData.get("report_id"));
  const reports = await getReportsService();
  await reports.resolve(reportId);
  revalidatePath("/moderation");
}
