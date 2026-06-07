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

  const { data: storyData } = await supabase
    .from("stories")
    .select(
      "id, title, summary, content_warning, created_at, peluk_boost, profiles(handle), story_episodes(views), story_peluk(count), story_comments(count)"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(3);
  const stories = (
    (storyData ?? []) as unknown as {
      id: string;
      title: string;
      summary: string;
      content_warning: string | null;
      created_at: string;
      peluk_boost: number;
      profiles: { handle: string } | null;
      story_episodes: { views: number }[];
      story_peluk: { count: number }[];
      story_comments: { count: number }[];
    }[]
  ).map((s) => ({
    id: s.id,
    title: s.title,
    snippet: s.summary,
    contentWarning: s.content_warning,
    date: fmtDate(s.created_at),
    handle: s.profiles?.handle ?? "Anonim",
    episodes: s.story_episodes?.length ?? 0,
    views: (s.story_episodes ?? []).reduce((sum, e) => sum + (e.views ?? 0), 0),
    peluk: (s.story_peluk?.[0]?.count ?? 0) + (s.peluk_boost ?? 0),
    comments: s.story_comments?.[0]?.count ?? 0,
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
