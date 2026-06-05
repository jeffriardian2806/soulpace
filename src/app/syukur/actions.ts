"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createGratitudeAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const items = [1, 2, 3, 4, 5]
    .map((n) => String(formData.get(`item_${n}`) ?? "").trim())
    .filter((x) => x.length > 0)
    .map((x) => x.slice(0, 300));

  if (items.length < 3) redirect("/syukur"); // minimal 3 hal

  await supabase.from("gratitude_entries").insert({ user_id: user.id, items });
  revalidatePath("/syukur");
  redirect("/syukur");
}

export async function deleteGratitudeAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("gratitude_entries").delete().eq("id", id);
  revalidatePath("/syukur");
}
