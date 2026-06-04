"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_MONTHS = [1, 3, 6, 12];

export async function createLetterAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const body = String(formData.get("body") ?? "").trim();
  const months = Number(formData.get("months"));
  if (!body || !ALLOWED_MONTHS.includes(months)) redirect("/surat");

  const deliver = new Date();
  deliver.setMonth(deliver.getMonth() + months);

  await supabase.from("future_letters").insert({
    user_id: user.id,
    body: body.slice(0, 10000),
    deliver_at: deliver.toISOString(),
  });
  revalidatePath("/surat");
  redirect("/surat");
}
