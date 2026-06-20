import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";
import { getNotificationsService } from "@/modules/notifications";
import { FeedShell } from "@/components/FeedShell";
import { GuestPrompt } from "@/components/GuestPrompt";
import { getDailyQuote } from "@/lib/dailyQuote";
import { resolveSupportMessage } from "@/lib/support/resolveMessage";
import { FeedSupportBanner } from "@/components/FeedSupportBanner";
import { PatternNudgeBanner } from "@/components/patterns/PatternNudgeBanner";
import { CrisisModeTopBanner } from "@/components/crisis-mode/CrisisModeTopBanner";
import { LateNightNudge } from "@/components/patterns/LateNightNudge";
import { detectPatternNudge } from "@/lib/patterns/detect";

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

  // Hybrid feed Cerita: 1 paling populer (by peluk) + 1 cerita terbaru, semua dari 30 hari terakhir.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const { data: storyRows, error: storyErr } = await supabase
    .from("stories")
    .select("id, title, summary, content_warning, created_at, peluk_boost, author_id")
    .eq("status", "published")
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(30);
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
  // Hybrid pick: 1 popular by peluk + 1 latest by created_at (deduped).
  const ranked = srows.map((s) => ({
    id: s.id,
    title: s.title,
    snippet: s.summary,
    contentWarning: s.content_warning,
    date: fmtDate(s.created_at),
    createdAt: s.created_at,
    handle: sHandles[s.author_id] ?? "Anonim",
    episodes: (sEps[s.id] ?? []).length,
    views: (sEps[s.id] ?? []).reduce((sum, e) => sum + (e.views ?? 0), 0),
    peluk: (sPlk[s.id] ?? 0) + (s.peluk_boost ?? 0),
    comments: sCmt[s.id] ?? 0,
  }));
  const picks: { label: string; story: typeof ranked[number] }[] = [];
  const byPeluk = [...ranked].sort((a, b) => b.peluk - a.peluk || +new Date(b.createdAt) - +new Date(a.createdAt));
  const topPopular = byPeluk[0];
  if (topPopular) picks.push({ label: "Paling banyak peluk", story: topPopular });
  const byLatest = ranked.filter((r) => r.id !== topPopular?.id);
  if (byLatest[0]) picks.push({ label: "Cerita terbaru", story: byLatest[0] });
  const stories = picks.map((p) => ({ label: p.label, ...p.story }));

  const quote = await getDailyQuote();

  // Support banner: kalau user pernah trigger crisis/severe screening dalam 24 jam terakhir
  let supportMessage: string | null = null;
  let supportTriggeredAt: string | null = null;
  if (user) {
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: recentTrigger } = await supabase
      .from("user_game_results")
      .select("created_at, detail")
      .eq("user_id", user.id)
      .like("game_key", "screening_%")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(5);
    type TriggerRow = { created_at: string; detail: { crisis?: boolean; severity?: string } | null };
    const rows = (recentTrigger ?? []) as TriggerRow[];
    const crisisRow = rows.find((r) => r.detail?.crisis === true);
    const severeRow = rows.find((r) => r.detail?.severity === "severe");
    const trigger = crisisRow ?? severeRow;
    if (trigger) {
      supportTriggeredAt = trigger.created_at;
      supportMessage = await resolveSupportMessage(
        crisisRow ? "crisis_screening" : "severe_screening",
        user.id
      );
    }
  }

  const patternNudge = user ? await detectPatternNudge() : null;

  const isGuest = !user;
  return (
    <>
      {user && (
        <div className="mx-auto max-w-2xl px-5 pt-4">
          <CrisisModeTopBanner />
        </div>
      )}
{supportMessage && supportTriggeredAt && (
        <div className="mx-auto max-w-2xl px-5 pt-4">
          <FeedSupportBanner message={supportMessage} triggeredAt={supportTriggeredAt} />
        </div>
      )}
      {patternNudge && (
        <div className="mx-auto max-w-2xl px-5 pt-4">
          <PatternNudgeBanner nudge={patternNudge} />
        </div>
      )}
      {user && (
        <div className="mx-auto max-w-2xl px-5 pt-4">
          <LateNightNudge />
        </div>
      )}
      <FeedShell
      isLoggedIn={!!user}
      currentUserId={user?.id ?? null}
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
      <GuestPrompt isGuest={isGuest} trackOpen={false} />
    </>
  );
}
