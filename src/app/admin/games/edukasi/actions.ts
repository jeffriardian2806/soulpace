"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Server-side slugify — enforce slug rapi walau bukan dari UI.
// Mirror slugify di TipsEditor (client) biar konsisten.
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  // Enforce slugify server-side (jangan cuma trim — slug HARUS rapi).
  const cleanSlug = slugify(p.slug || p.title);
  if (!cleanSlug || !p.title.trim()) return { error: "Slug & title wajib (slug jadi kosong setelah dirapikan)." };
  if (!p.categoryIds || p.categoryIds.length === 0) {
    return { error: "Wajib pilih minimal 1 kategori — biar muncul di Konsultasi flow." };
  }

  // Kalau EDIT: cek slug lama buat deteksi perubahan slug.
  let oldSlug: string | null = null;
  if (p.id) {
    const { data: existing } = await supabase
      .from("tip_topics")
      .select("slug")
      .eq("id", p.id)
      .maybeSingle();
    oldSlug = existing?.slug ?? null;
  }

  const row = {
    slug: cleanSlug,
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

  // Kalau slug BERUBAH saat edit: FK ON UPDATE CASCADE (migration 0054)
  // otomatis nyebar slug baru ke tips & tip_topic_categories. Jadi kita
  // TIDAK perlu manual update tips. Tapi junction kita rebuild dari categoryIds
  // di bawah, jadi pakai cleanSlug (slug baru) — udah konsisten.
  const slugChanged = !!(oldSlug && oldSlug !== cleanSlug);

  // === Junction: tip_topic ↔ kategori (M:N) — rebuild dari categoryIds ===
  // Delete by slug baru (kalau slug berubah, cascade udah pindahin row lama ke slug baru).
  // Delete juga by slug lama buat jaga-jaga (defensive, kalau cascade belum jalan).
  await supabase.from("tip_topic_categories").delete().eq("topic_slug", cleanSlug);
  if (slugChanged && oldSlug) {
    await supabase.from("tip_topic_categories").delete().eq("topic_slug", oldSlug);
  }

  if (p.categoryIds && p.categoryIds.length > 0) {
    const catRows = p.categoryIds.map((cid) => ({
      topic_slug: cleanSlug,
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

export async function importTipsAction(p: {
  topic_slug: string;
  topic_title: string;
  topic_emoji: string | null;
  rows: { title: string; content: string }[];
}): Promise<{ error: string | null; inserted: number }> {
  const { error: authErr, supabase } = await assertMod();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed", inserted: 0 };

  if (!p.topic_slug.trim()) return { error: "Topic tidak valid.", inserted: 0 };
  const clean = p.rows
    .map((r) => ({ title: r.title.trim(), content: r.content.trim() }))
    .filter((r) => r.title.length > 0 && r.content.length > 0);
  if (clean.length === 0) return { error: "Tidak ada artikel valid (judul & isi wajib terisi).", inserted: 0 };
  if (clean.length > 300) return { error: "Maksimal 300 artikel per import.", inserted: 0 };

  // sort_order lanjut dari artikel terakhir DI TOPIK INI
  const { data: last } = await supabase
    .from("tips")
    .select("sort_order")
    .eq("topic_slug", p.topic_slug)
    .order("sort_order", { ascending: false })
    .limit(1);
  const startSort = (last?.[0]?.sort_order ?? 0) + 1;

  const rows = clean.map((r, i) => ({
    topic_slug: p.topic_slug.trim(),          // SEMUA baris terikat topik ini
    topic_title: p.topic_title.trim(),
    topic_emoji: p.topic_emoji?.trim() || null,
    tip_title: r.title,
    tip_content: r.content,
    sort_order: startSort + i,
    is_active: true,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("tips").insert(rows);
  if (error) return { error: error.message, inserted: 0 };

  revalidatePath("/edukasi");
  revalidatePath("/admin/games/edukasi");
  return { error: null, inserted: rows.length };
}
