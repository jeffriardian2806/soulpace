"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPollAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const question = String(formData.get("question") ?? "").trim();
  const options = String(formData.get("options") ?? "")
    .split("\n")
    .map((o) => o.trim())
    .filter(Boolean);
  if (!question || options.length < 2) return;
  await supabase.from("polls").insert({ question, options });
  revalidatePath("/admin/playground");
  revalidatePath("/main/poll");
}

export async function createRoomAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!prompt) return;
  // nonaktifkan room lama, aktifkan yang baru
  await supabase.from("rooms").update({ is_active: false }).eq("is_active", true);
  await supabase.from("rooms").insert({ prompt });
  revalidatePath("/admin/playground");
  revalidatePath("/main/ruang");
}

export async function setPollActiveAction(id: string, isActive: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("polls").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/playground");
  revalidatePath("/main/poll");
}

export async function toggleRoomEntryAction(id: string, hidden: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("room_entries").update({ hidden: !hidden }).eq("id", id);
  revalidatePath("/admin/playground");
  revalidatePath("/main/ruang");
}
