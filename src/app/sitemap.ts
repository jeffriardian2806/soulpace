import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

const BASE = "https://soulpace.vercel.app";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // URL dasar selalu ada, apa pun yang terjadi dengan DB.
  const base: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/cerita`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const supabase = createPublicClient();

    const { data: storyRows } = await supabase
      .from("stories")
      .select("id, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(2000);
    const stories = (storyRows ?? []) as { id: string; updated_at: string }[];

    const { data: epRows } = await supabase
      .from("story_episodes")
      .select("id, story_id, created_at")
      .limit(10000);
    const episodes = (epRows ?? []) as {
      id: string;
      story_id: string;
      created_at: string;
    }[];

    const storyItems: MetadataRoute.Sitemap = stories.map((s) => ({
      url: `${BASE}/cerita/${s.id}`,
      lastModified: new Date(s.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    const epItems: MetadataRoute.Sitemap = episodes.map((e) => ({
      url: `${BASE}/cerita/${e.story_id}/${e.id}`,
      lastModified: new Date(e.created_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...base, ...storyItems, ...epItems];
  } catch {
    // DB gagal -> tetap balikin XML valid (URL dasar), jangan sampai 500.
    return base;
  }
}
