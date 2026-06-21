"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { detectContactLeak } from "@/lib/telekonsul/antiLeak";

const SESSION_WINDOW_HOURS = 24;

export async function createChatThreadAction(
  psikologId: string,
  mode: "chat" | "voice" | "video" = "chat"
): Promise<{ ok: boolean; threadId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Lo harus login dulu." };

  // 1. Resolve payment status via 3-layer override
  // Convention: feature_flags row 'telekonsul-chat'
  //   is_active=false → fitur disabled, reject
  //   is_active=true + is_premium=false → chat free
  //   is_active=true + is_premium=true  → chat paid
  const { data: flag } = await supabase
    .from("feature_flags")
    .select("is_active, is_premium")
    .eq("slug", "telekonsul-chat")
    .maybeSingle();
  if (!flag?.is_active) return { ok: false, error: "Fitur Telekonsul belum aktif." };
  const globalChatFree = flag.is_premium === false;

  const { data: psikolog } = await supabase
    .from("psikologs")
    .select("price_chat, is_chat_free_promo, is_active, accepts_new_patient")
    .eq("id", psikologId)
    .maybeSingle();
  if (!psikolog || !psikolog.is_active) return { ok: false, error: "Psikolog tidak tersedia." };
  if (!psikolog.accepts_new_patient)
    return { ok: false, error: "Psikolog ini lagi gak terima patient baru." };

  let paymentStatus: "free" | "paid" | "pending" = "pending";
  let paidAmount = 0;

  if (mode === "chat" && (globalChatFree || psikolog.is_chat_free_promo || psikolog.price_chat === 0)) {
    paymentStatus = "free";
    paidAmount = 0;
  } else if (mode !== "chat") {
    return { ok: false, error: "Voice/Video belum tersedia di Phase 1." };
  } else {
    // Future: voucher + payment flow
    return { ok: false, error: "Chat berbayar belum di-support di Phase 1." };
  }

  // 2. Insert thread
  const { data: thread, error } = await supabase
    .from("chat_threads")
    .insert({
      patient_id: user.id,
      psikolog_id: psikologId,
      mode,
      status: "active",
      payment_status: paymentStatus,
      paid_amount: paidAmount,
    })
    .select("id")
    .single();

  if (error || !thread) return { ok: false, error: error?.message ?? "Gagal create thread." };

  revalidatePath("/telekonsul/chat");
  return { ok: true, threadId: thread.id };
}

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

  // 1. Get thread + verify participant + status active
  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id, patient_id, psikolog_id, status, session_started_at, session_expires_at")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return { ok: false, error: "Thread tidak ditemukan." };
  if (thread.patient_id !== user.id && thread.psikolog_id !== user.id)
    return { ok: false, error: "Lo bukan participant di thread ini." };
  if (thread.status !== "active") return { ok: false, error: "Sesi udah berakhir. Buka sesi baru ya." };

  // Auto-close kalau expired
  if (thread.session_expires_at && new Date(thread.session_expires_at).getTime() <= Date.now()) {
    await supabase
      .from("chat_threads")
      .update({ status: "closed", closed_at: new Date().toISOString(), closed_reason: "expired" })
      .eq("id", threadId);
    return { ok: false, error: "Sesi udah expired. Buka sesi baru ya." };
  }

  // 2. Anti-leak filter
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

  // 3. Determine sender role
  const senderRole = thread.patient_id === user.id ? "patient" : "psikolog";
  const isFirstMessage = !thread.session_started_at;

  // 4. Insert message
  const { error: insertErr } = await supabase.from("chat_messages").insert({
    thread_id: threadId,
    sender_role: senderRole,
    sender_id: user.id,
    body_text: text,
    is_first_message: isFirstMessage,
  });
  if (insertErr) return { ok: false, error: insertErr.message };

  // 5. If first message dari patient → set session window
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

export async function startChatRedirectAction(formData: FormData) {
  const psikologId = formData.get("psikolog_id") as string;
  const r = await createChatThreadAction(psikologId, "chat");
  if (!r.ok || !r.threadId) {
    return redirect(`/telekonsul?err=${encodeURIComponent(r.error ?? "unknown")}`);
  }
  return redirect(`/telekonsul/chat/${r.threadId}`);
}
