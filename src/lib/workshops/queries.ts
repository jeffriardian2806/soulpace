import { createClient } from "@/lib/supabase/server";

export type Workshop = {
  id: string; title: string; description: string;
  event_date: string | null; price_text: string;
  form_url: string | null; materi_url: string | null;
  posted_at: string; unposted_at: string; is_active: boolean;
};

export async function getActiveWorkshops(): Promise<Workshop[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("workshops")
    .select("id, title, description, event_date, price_text, form_url, materi_url, posted_at, unposted_at, is_active")
    .order("event_date", { ascending: true, nullsFirst: false });
  return (data ?? []) as Workshop[];
}

export async function getWorkshopById(id: string): Promise<Workshop | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("workshops")
    .select("id, title, description, event_date, price_text, form_url, materi_url, posted_at, unposted_at, is_active")
    .eq("id", id).maybeSingle();
  return (data ?? null) as Workshop | null;
}

export async function getAllWorkshopsAdmin(): Promise<Workshop[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("workshops")
    .select("id, title, description, event_date, price_text, form_url, materi_url, posted_at, unposted_at, is_active")
    .order("created_at", { ascending: false });
  return (data ?? []) as Workshop[];
}
