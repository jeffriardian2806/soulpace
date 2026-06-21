import { createClient } from "@/lib/supabase/server";

export type Category = {
  id: number;
  slug: string;
  name: string;
};

export type ScreeningForCategory = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  item_count: number;
};

export type TipTopicForCategory = {
  slug: string;
  title: string;
  emoji: string | null;
};

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as Category | null) ?? null;
}

export async function getScreeningsByCategoryId(categoryId: number): Promise<ScreeningForCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("screening_instrument_categories")
    .select(`
      screening_instruments!inner (
        id, slug, name, subtitle, is_active
      )
    `)
    .eq("category_id", categoryId);

  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data as any[];
  const instruments = rows
    .map((r) => r.screening_instruments)
    .filter((si) => si && si.is_active);

  // Get item counts
  const ids = instruments.map((si) => si.id);
  if (ids.length === 0) return [];

  const { data: itemCounts } = await supabase
    .from("screening_items")
    .select("instrument_id")
    .in("instrument_id", ids);

  const counts: Record<string, number> = {};
  (itemCounts ?? []).forEach((r: { instrument_id: string }) => {
    counts[r.instrument_id] = (counts[r.instrument_id] ?? 0) + 1;
  });

  return instruments.map((si) => ({
    id: si.id,
    slug: si.slug,
    name: si.name,
    subtitle: si.subtitle ?? "",
    item_count: counts[si.id] ?? 0,
  }));
}

export async function getTipTopicsByCategoryId(categoryId: number): Promise<TipTopicForCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tip_topic_categories")
    .select(`
      tip_topics!inner (
        slug, title, emoji, is_active
      )
    `)
    .eq("category_id", categoryId);

  if (!data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data as any[];
  return rows
    .map((r) => r.tip_topics)
    .filter((tt) => tt && tt.is_active)
    .map((tt) => ({ slug: tt.slug, title: tt.title, emoji: tt.emoji }));
}

export type StoryPreview = {
  id: string;
  body: string;
  created_at: string;
  reaction_count: number;
};

export async function getStoriesByCategoryId(categoryId: number, limit = 3): Promise<StoryPreview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, body, created_at")
    .eq("category_id", categoryId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((p) => ({
    id: p.id,
    body: p.body.length > 140 ? p.body.slice(0, 140) + "..." : p.body,
    created_at: p.created_at,
    reaction_count: 0, // TODO: join reactions if needed
  }));
}

export type ConsultationSession = {
  id: string;
  user_id: string;
  category_id: number;
  keluhan_text: string;
  pemeriksaan_results: PemeriksaanResult[];
  saran_taken: SaranTaken[];
  is_shared_to_feed: boolean;
  shared_post_id: string | null;
  created_at: string;
};

export type PemeriksaanResult =
  | { type: "screening"; slug: string; score: number; band_label: string }
  | { type: "mood"; value: number; note?: string }
  | { type: "journal"; entry_id: string };

export type SaranTaken =
  | { type: "article"; slug: string }
  | { type: "psikolog_consultation" }
  | { type: "safety_plan" };

export async function getUserConsultationSessions(limit = 20): Promise<(ConsultationSession & { category_name: string })[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("consultation_sessions")
    .select(`
      id, user_id, category_id, keluhan_text, pemeriksaan_results, saran_taken,
      is_shared_to_feed, shared_post_id, created_at,
      categories ( name )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((s) => ({
    id: s.id,
    user_id: s.user_id,
    category_id: s.category_id,
    keluhan_text: s.keluhan_text,
    pemeriksaan_results: s.pemeriksaan_results ?? [],
    saran_taken: s.saran_taken ?? [],
    is_shared_to_feed: s.is_shared_to_feed,
    shared_post_id: s.shared_post_id,
    created_at: s.created_at,
    category_name: s.categories?.name ?? "Lainnya",
  }));
}

export async function getConsultationSessionById(id: string): Promise<(ConsultationSession & { category: Category }) | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // NOTE: tidak hardcode .eq("user_id") — biar RLS yang handle access:
  //   consult_select_own (0048): patient liat own session
  //   consult_select_via_thread (0051): psikolog liat session via chat_thread linked
  const { data } = await supabase
    .from("consultation_sessions")
    .select(`
      id, user_id, category_id, keluhan_text, pemeriksaan_results, saran_taken,
      is_shared_to_feed, shared_post_id, created_at,
      categories ( id, slug, name )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    keluhan_text: row.keluhan_text,
    pemeriksaan_results: row.pemeriksaan_results ?? [],
    saran_taken: row.saran_taken ?? [],
    is_shared_to_feed: row.is_shared_to_feed,
    shared_post_id: row.shared_post_id,
    created_at: row.created_at,
    category: {
      id: row.categories.id,
      slug: row.categories.slug,
      name: row.categories.name,
    },
  };
}
