import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";
import { getNotificationsService } from "@/modules/notifications";
import { FeedShell } from "@/components/FeedShell";
import { getDailyQuote } from "@/lib/dailyQuote";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const svc = await getPostsService();
  const categories = await svc.listCategories();
  const status = sp.status ?? "semua";
  const unanswered = status === "unanswered";
  const wish = ["didengar", "peluk", "saran"].includes(status) ? status : undefined;
  const { posts, peluked } = await svc.feedPage(
    sp.cat,
    0,
    20,
    user?.id ?? null,
    unanswered,
    wish
  );

  let unread = 0;
  if (user) {
    const notif = await getNotificationsService();
    unread = await notif.unreadCount(user.id);
  }

  const { data: storyRows, error: storyErr } = await supabase
    .from("stories")
    .select("id, title, summary, content_warning, created_at, peluk_boost, author_id")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(3);
  if (storyErr) console.error("[feed] stories error:", storyErr.message);

  type SR = { id: string; title: string; summary: string; content_warning: string | null; created_at: string; peluk_boost: number; author_id: string };
  const srows = (storyRows ?? []) as SR[];
  const sHandles: Record<string, string> = {};
  const sEps: Record<string, { views: number }[]> = {};
  const sPlk: Record<string, number> = {};
  const sCmt: Record<string, number> = {};
  if (srows.length > 0) {
    const aids = Array.from(new Set(srows.map((s) => s.author_id)));
    const sids = srows.map((s) => s.id);
    const [{ data: profs }, { data: eps }, { data: plks }, { data: cmts }] = await Promise.all([
      supabase.from("profiles").select("id, handle").in("id", aids),
      supabase.from("story_episodes").select("story_id, views").in("story_id", sids),
      supabase.from("story_peluk").select("story_id").in("story_id", sids),
      supabase.from("story_comments").select("story_id").in("story_id", sids),
    ]);
    (profs ?? []).forEach((p: { id: string; handle: string }) => { sHandles[p.id] = p.handle; });
    (eps ?? []).forEach((r: { story_id: string; views: number }) => { (sEps[r.story_id] ??= []).push({ views: r.views ?? 0 }); });
    (plks ?? []).forEach((r: { story_id: string }) => { sPlk[r.story_id] = (sPlk[r.story_id] ?? 0) + 1; });
    (cmts ?? []).forEach((r: { story_id: string }) => { sCmt[r.story_id] = (sCmt[r.story_id] ?? 0) + 1; });
  }
  const stories = srows.map((s) => ({
    id: s.id,
    title: s.title,
    snippet: s.summary,
    contentWarning: s.content_warning,
    date: fmtDate(s.created_at),
    handle: sHandles[s.author_id] ?? "Anonim",
    episodes: (sEps[s.id] ?? []).length,
    views: (sEps[s.id] ?? []).reduce((sum, e) => sum + (e.views ?? 0), 0),
    peluk: (sPlk[s.id] ?? 0) + (s.peluk_boost ?? 0),
    comments: sCmt[s.id] ?? 0,
  }));

  const quote = getDailyQuote();

  return (
    <FeedShell
      isLoggedIn={!!user}
      unread={unread}
      categories={categories}
      initialPosts={posts}
      initialPeluked={[...peluked]}
      initialCat={sp.cat}
      initialStatus={status}
      pageSize={20}
      quote={quote}
      stories={stories}
    />
  );
}
