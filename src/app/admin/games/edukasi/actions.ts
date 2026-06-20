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

// === TOPIC actions ===
export async function saveTopicAction(p: {
  id?: string;
  slug: string;
  title: string;
  emoji: string;
  definition: string;
  sort_order: number;
  is_active: boolean;
  categoryIds?: number[];
}): Promise<{ error: string | null }> {
  const { error: authErr, supabase } = await assertMod();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };

  if (!p.slug.trim() || !p.title.trim()) return { error: "Slug & title wajib." };

  const row = {
    slug: p.slug.trim(),
    title: p.title.trim(),
    emoji: p.emoji.trim() || null,
    definition: p.definition.trim() || null,
    sort_order: p.sort_order,
    is_active: p.is_active,
    updated_at: new Date().toISOString(),
  };

  const q = p.id
    ? supabase.from("tip_topics").update(row).eq("id", p.id)
    : supabase.from("tip_topics").insert(row);
  const { error } = await q;
  if (error) return { error: error.message };

  // === Junction: tip_topic ↔ kategori (M:N) ===
  // Delete existing, insert fresh sesuai categoryIds
  await supabase.from("tip_topic_categories").delete().eq("topic_slug", row.slug);

  if (p.categoryIds && p.categoryIds.length > 0) {
    const catRows = p.categoryIds.map((cid) => ({
      topic_slug: row.slug,
      category_id: cid,
    }));
    const rCat = await supabase.from("tip_topic_categories").insert(catRows);
    if (rCat.error) return { error: "Kategori save error: " + rCat.error.message };
  }

  revalidatePath("/edukasi");
  revalidatePath("/admin/games/edukasi");
  revalidatePath("/konsultasi");
  return { error: null };
}

export async function deleteTopicAction(id: string): Promise<{ error: string | null }> {
  const { error: authErr, supabase } = await assertMod();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };
  const { error } = await supabase.from("tip_topics").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/edukasi");
  revalidatePath("/admin/games/edukasi");
  return { error: null };
}

// === TIP actions ===
export async function saveTipAction(p: {
  id?: string;
  topic_slug: string;
  topic_title: string;
  topic_emoji: string;
  tip_title: string;
  tip_content: string;
  sort_order: number;
  is_active: boolean;
}): Promise<{ error: string | null }> {
  const { error: authErr, supabase } = await assertMod();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };

  if (!p.topic_slug.trim() || !p.tip_title.trim() || !p.tip_content.trim()) {
    return { error: "Topic slug, tip title, & content wajib." };
  }

  const row = {
    topic_slug: p.topic_slug.trim(),
    topic_title: p.topic_title.trim(),
    topic_emoji: p.topic_emoji.trim() || null,
    tip_title: p.tip_title.trim(),
    tip_content: p.tip_content.trim(),
    sort_order: p.sort_order,
    is_active: p.is_active,
    updated_at: new Date().toISOString(),
  };

  const q = p.id
    ? supabase.from("tips").update(row).eq("id", p.id)
    : supabase.from("tips").insert(row);
  const { error } = await q;
  if (error) return { error: error.message };

  revalidatePath("/edukasi");
  revalidatePath("/admin/games/edukasi");
  return { error: null };
}

export async function deleteTipAction(id: string): Promise<{ error: string | null }> {
  const { error: authErr, supabase } = await assertMod();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };
  const { error } = await supabase.from("tips").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/edukasi");
  revalidatePath("/admin/games/edukasi");
  return { error: null };
}
