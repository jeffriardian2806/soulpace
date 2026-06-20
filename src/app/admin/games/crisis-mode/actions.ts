"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertMod() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", supabase: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) return { error: "Forbidden", supabase: null };
  return { error: null, supabase };
}

export async function saveCrisisMessageAction(p: {
  id?: string;
  slot: string;
  text: string;
  sort_order: number;
  is_active: boolean;
}): Promise<{ error: string | null }> {
  const { error: authErr, supabase } = await assertMod();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };

  if (!p.slot.trim() || !p.text.trim()) return { error: "Slot & text wajib." };

  const row = {
    slot: p.slot.trim(),
    text: p.text.trim(),
    sort_order: p.sort_order,
    is_active: p.is_active,
    updated_at: new Date().toISOString(),
  };

  const q = p.id
    ? supabase.from("crisis_mode_messages").update(row).eq("id", p.id)
    : supabase.from("crisis_mode_messages").insert(row);
  const { error } = await q;
  if (error) return { error: error.message };

  revalidatePath("/crisis-mode");
  revalidatePath("/admin/games/crisis-mode");
  return { error: null };
}

export async function deleteCrisisMessageAction(id: string): Promise<{ error: string | null }> {
  const { error: authErr, supabase } = await assertMod();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };
  const { error } = await supabase.from("crisis_mode_messages").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/crisis-mode");
  revalidatePath("/admin/games/crisis-mode");
  return { error: null };
}
