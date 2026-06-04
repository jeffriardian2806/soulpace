"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createJournalAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect("/jurnal/baru");

  await supabase.from("journal_entries").insert({
    user_id: user.id,
    title: title || null,
    body: body.slice(0, 20000),
  });
  revalidatePath("/jurnal");
  redirect("/jurnal");
}

export async function deleteJournalAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
  }
  revalidatePath("/jurnal");
  redirect("/jurnal");
}
