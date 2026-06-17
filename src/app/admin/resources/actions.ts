"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Tidak login.");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!data || (data.role !== "moderator" && data.role !== "admin")) throw new Error("Tidak diizinkan.");
  return { supabase };
}

export type ResourcePayload = {
  id?: string;
  slug: string;
  kind: "crisis_line" | "psychologist" | "article" | "community" | "worksheet";
  title: string;
  subtitle?: string;
  body?: string;
  url?: string;
  phone?: string;
  location?: string;
  tags: string[];
  sort_order: number;
  is_active: boolean;
};

export async function saveResourceAction(p: ResourcePayload): Promise<{ error: string | null }> {
  const { supabase } = await requireAdmin();
  if (!p.slug.trim() || !p.title.trim()) return { error: "Slug & title wajib." };
  const row = {
    slug: p.slug.trim(),
    kind: p.kind,
    title: p.title.trim(),
    subtitle: p.subtitle?.trim() || null,
    body: p.body?.trim() || null,
    url: p.url?.trim() || null,
    phone: p.phone?.trim() || null,
    location: p.location?.trim() || null,
    tags: p.tags,
    sort_order: p.sort_order,
    is_active: p.is_active,
    updated_at: new Date().toISOString(),
  };
  const q = p.id ? supabase.from("resources").update(row).eq("id", p.id) : supabase.from("resources").insert(row);
  const { error } = await q;
  if (error) return { error: error.message };
  revalidatePath("/admin/resources");
  revalidatePath("/resource");
  return { error: null };
}

export async function deleteResourceAction(id: string): Promise<{ error: string | null }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/resources");
  revalidatePath("/resource");
  return { error: null };
}
