"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", supabase: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) {
    return { error: "Not authorized", supabase: null };
  }
  return { error: null, supabase, userId: user.id };
}

export async function addBlocklistAction(p: {
  pattern: string;
  match_type: "keyword" | "contains" | "regex";
  label: string;
  category: string;
}): Promise<{ error: string | null }> {
  const { error: authErr, supabase, userId } = await assertAdmin();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };

  const pattern = p.pattern.trim();
  if (!pattern) return { error: "Pattern wajib diisi." };

  // Validasi regex kalau match_type regex
  if (p.match_type === "regex") {
    try {
      new RegExp(pattern);
    } catch {
      return { error: "Regex tidak valid. Cek polanya." };
    }
  }

  const { error } = await supabase.from("leak_blocklist").insert({
    pattern,
    match_type: p.match_type,
    label: p.label.trim() || null,
    category: p.category.trim() || "other",
    created_by: userId,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/telekonsul-blocklist");
  return { error: null };
}

export async function toggleBlocklistAction(id: string, isActive: boolean): Promise<{ error: string | null }> {
  const { error: authErr, supabase } = await assertAdmin();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };
  const { error } = await supabase.from("leak_blocklist").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/telekonsul-blocklist");
  return { error: null };
}

export async function deleteBlocklistAction(id: string): Promise<{ error: string | null }> {
  const { error: authErr, supabase } = await assertAdmin();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };
  const { error } = await supabase.from("leak_blocklist").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/telekonsul-blocklist");
  return { error: null };
}
