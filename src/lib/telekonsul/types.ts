// Telekonsul Phase 1 types

export type Psikolog = {
  id: string;
  slug: string;
  full_name: string;
  gelar: string | null;
  str_number: string | null;
  photo_url: string | null;
  bio: string | null;
  specializations: string[];
  experience_years: number;
  languages: string[];
  price_chat: number;
  price_voice: number | null;
  price_video: number | null;
  is_chat_free_promo: boolean;
  is_active: boolean;
  accepts_new_patient: boolean;
  rating_avg: number;
  rating_count: number;
};

export type ChatMode = "chat" | "voice" | "video";
export type ThreadStatus = "active" | "closed";
export type SenderRole = "patient" | "psikolog" | "system";

export type ChatThread = {
  id: string;
  patient_id: string;
  psikolog_id: string;
  mode: ChatMode;
  status: ThreadStatus;
  payment_status: "free" | "paid" | "free_with_voucher" | "pending";
  paid_amount: number;
  session_started_at: string | null;
  session_expires_at: string | null;
  closed_reason: string | null;
  consultation_session_id: string | null;
  previous_thread_id: string | null;
  created_at: string;
  closed_at: string | null;
  // Joined fields
  psikolog?: Pick<Psikolog, "id" | "slug" | "full_name" | "gelar" | "photo_url">;
  last_message?: { body_text: string; created_at: string; sender_role: SenderRole };
  unread_count?: number;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  sender_role: SenderRole;
  sender_id: string | null;
  body_text: string;
  attachments: unknown[];
  flagged_contact_leak: boolean;
  is_first_message: boolean;
  created_at: string;
  read_at: string | null;
};
