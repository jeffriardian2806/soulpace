import { createClient } from "@/lib/supabase/server";

export type EventCategory = { id: string; label: string; emoji: string | null; sort_order: number; is_active: boolean };

export type EventRow = {
  id: string;
  category_id: string | null;
  category_label: string | null;
  category_emoji: string | null;
  title: string;
  description: string;
  event_date: string | null;
  price_text: string;
  form_url: string | null;
  materi_url: string | null;
  posted_at: string;
  unposted_at: string;
  is_active: boolean;
};

const SELECT = "id, category_id, title, description, event_date, price_text, form_url, materi_url, posted_at, unposted_at, is_active, category:event_categories(label, emoji)";

type Raw = Omit<EventRow, "category_label" | "category_emoji"> & { category: { label: string; emoji: string | null } | null };
function flatten(r: Raw): EventRow {
  return {
    id: r.id, category_id: r.category_id,
    category_label: r.category?.label ?? null, category_emoji: r.category?.emoji ?? null,
    title: r.title, description: r.description,
    event_date: r.event_date, price_text: r.price_text,
    form_url: r.form_url, materi_url: r.materi_url,
    posted_at: r.posted_at, unposted_at: r.unposted_at, is_active: r.is_active,
  };
}

export async function getActiveEvents(): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select(SELECT).order("event_date", { ascending: true, nullsFirst: false });
  return ((data ?? []) as unknown as Raw[]).map(flatten);
}

export async function getEventById(id: string): Promise<EventRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select(SELECT).eq("id", id).maybeSingle();
  return data ? flatten(data as unknown as Raw) : null;
}

export async function getAllEventsAdmin(): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select(SELECT).order("created_at", { ascending: false });
  return ((data ?? []) as unknown as Raw[]).map(flatten);
}

export async function getEventCategories(activeOnly = true): Promise<EventCategory[]> {
  const supabase = await createClient();
  let q = supabase.from("event_categories").select("id, label, emoji, sort_order, is_active").order("sort_order");
  if (activeOnly) q = q.eq("is_active", true);
  const { data } = await q;
  return (data ?? []) as EventCategory[];
}
