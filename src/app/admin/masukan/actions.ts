"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleHiddenAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const currentlyHidden = String(formData.get("hidden") ?? "") === "true";
  // RLS memastikan hanya moderator yang bisa update
  if (id) await supabase.from("app_feedback").update({ hidden: !currentlyHidden }).eq("id", id);

  revalidatePath("/admin/masukan");
  revalidatePath("/");
  revalidatePath("/ulasan");
}
