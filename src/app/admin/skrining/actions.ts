"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InstrumentPayload } from "./types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return { supabase, ok: prof?.role === "moderator" };
}

export async function saveInstrumentAction(
  p: InstrumentPayload
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "Akses ditolak (khusus admin)." };

  const items = p.items.map((x) => ({ text: x.text.trim(), reverse: x.reverse })).filter((x) => x.text);
  const options = p.options.filter((o) => o.label.trim());
  const bands = p.bands.filter((b) => b.label.trim());

  if (!p.slug.trim() || !p.name.trim()) {
    return { ok: false, error: "Slug dan nama wajib diisi." };
  }
  if (items.length === 0 || options.length === 0 || bands.length === 0) {
    return { ok: false, error: "Minimal 1 pertanyaan, 1 opsi, dan 1 band." };
  }

  let crisisPos = p.crisisItemPosition;
  if (crisisPos != null && (crisisPos < 1 || crisisPos > items.length)) {
    crisisPos = null;
  }

  const fields = {
    slug: p.slug.trim(),
    name: p.name.trim(),
    subtitle: p.subtitle.trim(),
    prompt: p.prompt.trim(),
    crisis_item_position: crisisPos,
    sort_order: p.sortOrder,
    is_active: p.isActive,
  };

  let instrumentId = p.id;
  if (instrumentId) {
    const { error } = await supabase
      .from("screening_instruments")
      .update(fields)
      .eq("id", instrumentId);
    if (error) return { ok: false, error: error.message };
    await supabase.from("screening_items").delete().eq("instrument_id", instrumentId);
    await supabase.from("screening_options").delete().eq("instrument_id", instrumentId);
    await supabase.from("screening_bands").delete().eq("instrument_id", instrumentId);
  } else {
    const { data, error } = await supabase
      .from("screening_instruments")
      .insert(fields)
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Gagal menyimpan." };
    instrumentId = data.id as string;
  }

  const itemRows = items.map((it, i) => ({
    instrument_id: instrumentId,
    position: i + 1,
    text: it.text,
    reverse: it.reverse,
  }));
  const optionRows = options.map((o, i) => ({
    instrument_id: instrumentId,
    label: o.label.trim(),
    value: o.value,
    sort_order: i + 1,
  }));
  const bandRows = bands.map((b) => ({
    instrument_id: instrumentId,
    min_score: b.min,
    max_score: b.max,
    label: b.label.trim(),
    advice: b.advice.trim(),
  }));

  const r1 = await supabase.from("screening_items").insert(itemRows);
  const r2 = await supabase.from("screening_options").insert(optionRows);
  const r3 = await supabase.from("screening_bands").insert(bandRows);
  const err = r1.error || r2.error || r3.error;
  if (err) return { ok: false, error: err.message };

  // === Junction: skrining ↔ kategori (M:N) ===
  // Delete existing, insert fresh sesuai p.categoryIds
  await supabase
    .from("screening_instrument_categories")
    .delete()
    .eq("instrument_id", instrumentId);

  if (p.categoryIds && p.categoryIds.length > 0) {
    const catRows = p.categoryIds.map((cid) => ({
      instrument_id: instrumentId,
      category_id: cid,
    }));
    const rCat = await supabase.from("screening_instrument_categories").insert(catRows);
    if (rCat.error) return { ok: false, error: "Kategori save error: " + rCat.error.message };
  }

  revalidatePath("/admin/skrining");
  revalidatePath("/skrining");
  revalidatePath("/konsultasi");
  return { ok: true };
}

export async function deleteInstrumentAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "Akses ditolak (khusus admin)." };
  const { error } = await supabase.from("screening_instruments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/skrining");
  revalidatePath("/skrining");
  return { ok: true };
}
