"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { detectContactLeak } from "@/lib/telekonsul/antiLeak";
import type { SupabaseClient } from "@supabase/supabase-js";

const SESSION_WINDOW_HOURS = 24;

// ============================================================
// PAID VALIDATION GATE (future-proof, ready for Phase 2)
// ============================================================
// Returns whether patient can start chat with psikolog.
// Layer order:
//   1. Global feature_flag 'telekonsul-chat': is_active + is_premium
//      - is_active=false  → feature disabled
//      - is_premium=false → BETA free, allow
//      - is_premium=true  → check next layers
//   2. Psikolog setting: is_chat_free_promo OR price_chat===0 → allow
//   3. Voucher: validate code, check usage, applicability → allow if valid
//   4. (Phase 2 placeholder) User balance check
//   5. Else: reject — requires payment

type GateResult =
  | { allowed: true; reason: "free_beta" | "psikolog_free_promo" | "voucher"; voucherId?: string }
  | { allowed: false; reason: string; amount?: number; psikologId?: string };

async function canPatientStartChat(
  supabase: SupabaseClient,
  patientId: string,
  psikologId: string,
  voucherCode?: string
): Promise<GateResult> {
  // 1. Global flag
  const { data: flag } = await supabase
    .from("feature_flags")
    .select("is_active, is_premium")
    .eq("slug", "telekonsul-chat")
    .maybeSingle();
  if (!flag?.is_active) return { allowed: false, reason: "feature_disabled" };
  if (!flag.is_premium) return { allowed: true, reason: "free_beta" };

  // 2. Psikolog setting
  const { data: psikolog } = await supabase
    .from("psikologs")
    .select("is_chat_free_promo, price_chat")
    .eq("id", psikologId)
    .maybeSingle();
  if (!psikolog) return { allowed: false, reason: "psikolog_not_found" };
  if (psikolog.is_chat_free_promo || psikolog.price_chat === 0) {
    return { allowed: true, reason: "psikolog_free_promo" };
  }

  // 3. Voucher
  if (voucherCode) {
    const v = await validateVoucher(supabase, voucherCode, patientId, psikologId);
    if (v.valid) return { allowed: true, reason: "voucher", voucherId: v.voucherId };
  }

  // 4. (Phase 2) Balance check placeholder
  //    const balance = await getUserBalance(supabase, patientId);
  //    if (balance >= psikolog.price_chat) return { allowed: true, reason: "balance" };

  // 5. Reject
  return {
    allowed: false,
    reason: "requires_payment",
    amount: psikolog.price_chat,
    psikologId,
  };
}

async function validateVoucher(
  supabase: SupabaseClient,
  code: string,
  patientId: string,
  psikologId: string
): Promise<{ valid: boolean; voucherId?: string; reason?: string }> {
  const { data: voucher } = await supabase
    .from("vouchers")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();
  if (!voucher) return { valid: false, reason: "voucher_not_found" };

  const now = Date.now();
  if (voucher.valid_from && new Date(voucher.valid_from).getTime() > now)
    return { valid: false, reason: "voucher_not_yet_valid" };
  if (voucher.valid_until && new Date(voucher.valid_until).getTime() < now)
    return { valid: false, reason: "voucher_expired" };
  if (voucher.max_uses && voucher.used_count >= voucher.max_uses)
    return { valid: false, reason: "voucher_maxed" };

  if (voucher.applicable_psikolog_ids && voucher.applicable_psikolog_ids.length > 0) {
    if (!voucher.applicable_psikolog_ids.includes(psikologId))
      return { valid: false, reason: "voucher_not_applicable_psikolog" };
  }
  if (!voucher.applicable_modes?.includes("chat"))
    return { valid: false, reason: "voucher_not_applicable_mode" };

  const { count } = await supabase
    .from("voucher_redemptions")
    .select("*", { count: "exact", head: true })
    .eq("voucher_id", voucher.id)
    .eq("patient_id", patientId);
  if (voucher.per_user_limit && (count ?? 0) >= voucher.per_user_limit)
    return { valid: false, reason: "voucher_user_limit_reached" };

  return { valid: true, voucherId: voucher.id };
}

// ============================================================
// CREATE CHAT THREAD
// ============================================================
export async function createChatThreadAction(
  psikologId: string,
  mode: "chat" | "voice" | "video" = "chat",
  consultationSessionId?: string,
  voucherCode?: string
): Promise<{ ok: boolean; threadId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Lo harus login dulu." };

  if (mode !== "chat") {
    return { ok: false, error: "Voice/Video belum tersedia di Phase 1." };
  }

  // Verify psikolog active + accepting patient
  const { data: psikolog } = await supabase
    .from("psikologs")
    .select("is_active, accepts_new_patient")
    .eq("id", psikologId)
    .maybeSingle();
  if (!psikolog || !psikolog.is_active)
    return { ok: false, error: "Psikolog tidak tersedia." };
  if (!psikolog.accepts_new_patient)
    return { ok: false, error: "Psikolog ini lagi gak terima patient baru." };

  // Paid validation gate
  const gate = await canPatientStartChat(supabase, user.id, psikologId, voucherCode);
  if (!gate.allowed) {
    if (gate.reason === "requires_payment") {
      return {
        ok: false,
        error: `Konsultasi ini butuh bayar Rp${gate.amount?.toLocaleString("id-ID")}. Gunain voucher atau top up dulu.`,
      };
    }
    return { ok: false, error: `Akses ditolak: ${gate.reason}` };
  }

  // Verify consultation_session_id (kalau ada) - harus milik user
  if (consultationSessionId) {
    const { data: cs } = await supabase
      .from("consultation_sessions")
      .select("id, user_id")
      .eq("id", consultationSessionId)
      .maybeSingle();
    if (!cs || cs.user_id !== user.id) {
      return { ok: false, error: "Rekam medis ga valid atau bukan milik lo." };
    }
  }

  // Map gate reason → payment_status
  const paymentStatus =
    gate.reason === "voucher" ? "free_with_voucher" : "free";

  // Insert thread
  const { data: thread, error } = await supabase
    .from("chat_threads")
    .insert({
      patient_id: user.id,
      psikolog_id: psikologId,
      mode,
      status: "active",
      payment_status: paymentStatus,
      paid_amount: 0,
      voucher_id: gate.reason === "voucher" ? gate.voucherId : null,
      consultation_session_id: consultationSessionId ?? null,
    })
    .select("id")
    .single();

  if (error || !thread) return { ok: false, error: error?.message ?? "Gagal create thread." };

  // Track voucher redemption kalau pakai voucher
  if (gate.reason === "voucher" && gate.voucherId) {
    await supabase.from("voucher_redemptions").insert({
      voucher_id: gate.voucherId,
      patient_id: user.id,
      thread_id: thread.id,
    });
    // Increment used_count
    await supabase.rpc("increment_voucher_used", { voucher_id: gate.voucherId }).then(() => {});
    // Fallback if RPC doesn't exist: do nothing, count tracked via voucher_redemptions
  }

  // Auto-insert system message (rekam medis context) kalau consultation_session linked
  if (consultationSessionId) {
    const { data: cs } = await supabase
      .from("consultation_sessions")
      .select(
        "keluhan_text, pemeriksaan_results, saran_taken, category:categories(name)"
      )
      .eq("id", consultationSessionId)
      .maybeSingle();
    if (cs) {
      const cat = (cs as { category: { name: string } | { name: string }[] | null }).category;
      const catName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
      const pemeriksaanList = (cs.pemeriksaan_results as Array<{ type: string; slug?: string; score?: number; band_label?: string }>) ?? [];
      const skriningSummary = pemeriksaanList
        .filter((p) => p.type === "screening")
        .map((p) => `• ${p.slug?.toUpperCase()}: skor ${p.score} (${p.band_label})`)
        .join("\n");

      const systemBody = [
        `📋 REKAM MEDIS dari Konsultasi Mandiri`,
        catName ? `Kategori: ${catName}` : null,
        ``,
        `**Keluhan utama:**`,
        cs.keluhan_text,
        ``,
        skriningSummary ? `**Hasil skrining:**\n${skriningSummary}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      await supabase.from("chat_messages").insert({
        thread_id: thread.id,
        sender_role: "system",
        sender_id: null,
        body_text: systemBody,
        is_first_message: true,
      });
    }
  }

  revalidatePath("/telekonsul/chat");
  return { ok: true, threadId: thread.id };
}

// ============================================================
// SEND MESSAGE
// ============================================================
export async function sendMessageAction(
  threadId: string,
  bodyText: string
): Promise<{ ok: boolean; error?: string; flagged?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Lo harus login dulu." };

  const text = bodyText.trim();
  if (text.length === 0) return { ok: false, error: "Pesan kosong." };
  if (text.length > 4000) return { ok: false, error: "Pesan terlalu panjang (max 4000 char)." };

  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id, patient_id, psikolog_id, status, session_started_at, session_expires_at")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return { ok: false, error: "Thread tidak ditemukan." };
  if (thread.patient_id !== user.id && thread.psikolog_id !== user.id)
    return { ok: false, error: "Lo bukan participant di thread ini." };
  if (thread.status !== "active") return { ok: false, error: "Sesi udah berakhir. Buka sesi baru ya." };

  if (thread.session_expires_at && new Date(thread.session_expires_at).getTime() <= Date.now()) {
    await supabase
      .from("chat_threads")
      .update({ status: "closed", closed_at: new Date().toISOString(), closed_reason: "expired" })
      .eq("id", threadId);
    return { ok: false, error: "Sesi udah expired. Buka sesi baru ya." };
  }

  const leak = detectContactLeak(text);
  if (leak.found) {
    return {
      ok: false,
      flagged: true,
      error:
        "Pesan ga bisa dikirim — ke-detect ada kontak (" +
        leak.matches.join(", ") +
        "). Soulpace policy: dilarang share kontak off-platform di chat.",
    };
  }

  const senderRole = thread.patient_id === user.id ? "patient" : "psikolog";
  const isFirstMessage = !thread.session_started_at;

  const { error: insertErr } = await supabase.from("chat_messages").insert({
    thread_id: threadId,
    sender_role: senderRole,
    sender_id: user.id,
    body_text: text,
    is_first_message: isFirstMessage,
  });
  if (insertErr) return { ok: false, error: insertErr.message };

  if (isFirstMessage && senderRole === "patient") {
    const now = new Date();
    const expires = new Date(now.getTime() + SESSION_WINDOW_HOURS * 3600 * 1000);
    await supabase
      .from("chat_threads")
      .update({
        session_started_at: now.toISOString(),
        session_expires_at: expires.toISOString(),
      })
      .eq("id", threadId);
  }

  revalidatePath(`/telekonsul/chat/${threadId}`);
  revalidatePath("/telekonsul/chat");
  return { ok: true };
}

// ============================================================
// REDIRECT HELPERS (form actions)
// ============================================================
export async function startChatRedirectAction(formData: FormData) {
  const psikologId = formData.get("psikolog_id") as string;
  const consultationSessionId = (formData.get("consultation_session_id") as string) || undefined;
  const r = await createChatThreadAction(psikologId, "chat", consultationSessionId);
  if (!r.ok || !r.threadId) {
    return redirect(`/telekonsul?err=${encodeURIComponent(r.error ?? "unknown")}`);
  }
  return redirect(`/telekonsul/chat/${r.threadId}`);
}
