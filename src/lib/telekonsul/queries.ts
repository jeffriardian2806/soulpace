import { createClient } from "@/lib/supabase/server";
import type { Psikolog, ChatThread, ChatMessage } from "./types";

export async function getActivePsikologs(): Promise<Psikolog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("psikologs")
    .select("*")
    .eq("is_active", true)
    .eq("accepts_new_patient", true)
    .order("rating_avg", { ascending: false });
  return (data ?? []) as Psikolog[];
}

export async function getPsikologBySlug(slug: string): Promise<Psikolog | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("psikologs")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as Psikolog) ?? null;
}

export async function getChatFreeFlag(): Promise<boolean> {
  // Convention: feature_flags row 'telekonsul-chat'
  //   is_active=true + is_premium=false → chat free
  //   is_active=true + is_premium=true  → chat paid (butuh voucher/bayar)
  //   is_active=false                   → fitur disabled
  const supabase = await createClient();
  const { data } = await supabase
    .from("feature_flags")
    .select("is_active, is_premium")
    .eq("slug", "telekonsul-chat")
    .maybeSingle();
  return data?.is_active === true && data?.is_premium === false;
}

// Inbox: list threads dimana user adalah participant (patient OR psikolog)
// Returns enriched with patient_handle + viewer_role
export async function getInboxForUser(userId: string): Promise<ChatThread[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chat_threads")
    .select(
      "*, psikolog:psikologs!chat_threads_psikolog_id_fkey(id, slug, full_name, gelar, photo_url)"
    )
    .or(`patient_id.eq.${userId},psikolog_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (!data || data.length === 0) return [];

  // Fetch patient handles via separate query (FK to auth.users, profiles is 1:1 logical)
  const patientIds = Array.from(new Set(data.map((t: { patient_id: string }) => t.patient_id)));
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, handle")
    .in("id", patientIds);
  const handleMap = new Map((profs ?? []).map((p: { id: string; handle: string }) => [p.id, p.handle]));

  return data.map((t: { patient_id: string }) => ({
    ...t,
    patient_handle: handleMap.get(t.patient_id),
    viewer_role: t.patient_id === userId ? "patient" : "psikolog",
  })) as ChatThread[];
}

export async function getThreadById(
  threadId: string,
  userId: string
): Promise<ChatThread | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chat_threads")
    .select(
      "*, psikolog:psikologs!chat_threads_psikolog_id_fkey(id, slug, full_name, gelar, photo_url)"
    )
    .eq("id", threadId)
    .or(`patient_id.eq.${userId},psikolog_id.eq.${userId}`)
    .maybeSingle();
  return (data as ChatThread) ?? null;
}

export async function getMessagesForThread(threadId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  return (data ?? []) as ChatMessage[];
}

// Session expiry check (lazy: hit DB & auto-close kalau expired)
export async function maybeAutoCloseExpiredThread(threadId: string): Promise<void> {
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("chat_threads")
    .select("status, session_expires_at")
    .eq("id", threadId)
    .maybeSingle();
  if (!t || t.status === "closed" || !t.session_expires_at) return;
  if (new Date(t.session_expires_at).getTime() <= Date.now()) {
    await supabase
      .from("chat_threads")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        closed_reason: "expired",
      })
      .eq("id", threadId);
  }
}

// Fetch consultation_sessions context for thread display
// Returns null kalau session_id invalid atau RLS deny (gak akses)
export async function getConsultationContextById(sessionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("consultation_sessions")
    .select(
      "id, user_id, category_id, keluhan_text, pemeriksaan_results, saran_taken, created_at, category:categories(name, slug)"
    )
    .eq("id", sessionId)
    .maybeSingle();
  return data;
}

// Fetch SEMUA laporan pemeriksaan pasien dari user_game_results
// (skrining, MHCU, games). Read-only buat psikolog via thread.
// RLS: butuh policy yang allow psikolog baca via chat_thread (migration 0052).
export async function getPatientMedicalReports(patientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_game_results")
    .select("id, game_key, summary, detail, created_at")
    .eq("user_id", patientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

