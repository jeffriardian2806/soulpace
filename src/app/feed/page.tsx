import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";
import { getNotificationsService } from "@/modules/notifications";
import { FeedShell } from "@/components/FeedShell";
import { getDailyQuote } from "@/lib/dailyQuote";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const svc = await getPostsService();
  const categories = await svc.listCategories();
  const { posts, peluked } = await svc.feedPage(sp.cat, 0, 20, user?.id ?? null);

  let unread = 0;
  if (user) {
    const notif = await getNotificationsService();
    unread = await notif.unreadCount(user.id);
  }

  const { data: storyData } = await supabase
    .from("stories")
    .select(
      "id, title, summary, content_warning, profiles!inner(handle), story_episodes(count)"
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
      profiles: { handle: string } | null;
      story_episodes: { count: number }[];
    }[]
  ).map((s) => ({
    id: s.id,
    title: s.title,
    snippet: s.summary,
    contentWarning: s.content_warning,
    handle: s.profiles?.handle ?? "Anonim",
    episodes: s.story_episodes?.[0]?.count ?? 0,
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
      pageSize={20}
      quote={quote}
      stories={stories}
    />
  );
}
