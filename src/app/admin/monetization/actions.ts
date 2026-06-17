"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Tidak login.");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!data || (data.role !== "moderator" && data.role !== "admin")) throw new Error("Tidak diizinkan.");
  return { supabase, userId: user.id };
}

export async function toggleFeaturePremiumAction(slug: string, isPremium: boolean, tokenCost: number): Promise<{ error: string | null }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("feature_flags")
    .update({ is_premium: isPremium, token_cost: tokenCost, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) return { error: error.message };
  revalidatePath("/admin/monetization");
  return { error: null };
}

export async function upsertFeatureFlagAction(p: { slug: string; name: string; description?: string; is_premium: boolean; token_cost: number; sort_order: number; is_active: boolean }): Promise<{ error: string | null }> {
  const { supabase } = await requireAdmin();
  if (!p.slug.trim() || !p.name.trim()) return { error: "Slug & nama wajib." };
  const row = {
    slug: p.slug.trim(),
    name: p.name.trim(),
    description: p.description ?? null,
    is_premium: p.is_premium,
    token_cost: p.token_cost,
    sort_order: p.sort_order,
    is_active: p.is_active,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("feature_flags").upsert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/monetization");
  return { error: null };
}

export async function mintVoucherAction(p: { code: string; notes?: string; token_amount: number; days_amount: number; max_redeem: number; expires_at?: string | null }): Promise<{ error: string | null }> {
  const { supabase, userId } = await requireAdmin();
  if (!p.code.trim()) return { error: "Kode voucher wajib." };
  if (p.token_amount < 0 || p.days_amount < 0) return { error: "Nilai ga boleh negatif." };
  if (p.token_amount === 0 && p.days_amount === 0) return { error: "Minimal salah satu (token / hari) > 0." };
  if (p.max_redeem < 1) return { error: "max_redeem minimal 1." };
  const row = {
    code: p.code.trim().toUpperCase(),
    notes: p.notes ?? null,
    token_amount: p.token_amount,
    days_amount: p.days_amount,
    max_redeem: p.max_redeem,
    expires_at: p.expires_at && p.expires_at !== "" ? p.expires_at : null,
    created_by: userId,
  };
  const { error } = await supabase.from("vouchers").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/monetization");
  return { error: null };
}

export async function toggleVoucherActiveAction(id: string, isActive: boolean): Promise<{ error: string | null }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("vouchers").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/monetization");
  return { error: null };
}

export async function deleteVoucherAction(id: string): Promise<{ error: string | null }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("vouchers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/monetization");
  return { error: null };
}
