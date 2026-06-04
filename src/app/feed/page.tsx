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
    />
  );
}
