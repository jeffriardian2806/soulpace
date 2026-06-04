import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";
import { getNotificationsService } from "@/modules/notifications";
import { FeedList } from "@/components/FeedList";
import { guestAction } from "@/app/auth/actions";
import { getDailyQuote } from "@/lib/dailyQuote";
import { BellIcon, UserIcon, GearIcon, LogoutIcon } from "@/components/icons";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";

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
  const { categories, posts } = await svc.getFeed({ categorySlug: sp.cat });
  const peluked = await svc.pelukedIds(
    posts.map((p) => p.id),
    user?.id ?? null
  );

  let unread = 0;
  if (user) {
    const notif = await getNotificationsService();
    unread = await notif.unreadCount(user.id);
  }

  const quote = getDailyQuote();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      {/* STICKY HEADER - header + horizontal scroll categories */}
      <div className="sticky top-0 z-50 -mx-5 -mt-6 flex flex-col gap-4 bg-white px-5 py-6 shadow-sm">
        {/* Top bar with logo and icons */}
        <header className="flex items-center justify-between">
          {/* Soulpace - clickable to scroll to top */}
          <ScrollToTopButton /> 

          {user ? (
            <div className="flex items-center gap-5 text-ink/55">
              <Link
                href="/notifications"
                aria-label="Notifikasi"
                title="Notifikasi"
                className="relative transition-colors hover:text-sky-600"
              >
                <BellIcon />
                {unread > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-semibold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                aria-label="Profil"
                title="Profil"
                className="transition-colors hover:text-sky-600"
              >
                <UserIcon />
              </Link>
              <Link
                href="/settings"
                aria-label="Pengaturan"
                title="Pengaturan"
                className="transition-colors hover:text-sky-600"
              >
                <GearIcon />
              </Link>
              <form action="/auth/signout" method="post" className="flex">
                <button
                  aria-label="Keluar"
                  title="Keluar"
                  className="transition-colors hover:text-sky-600"
                >
                  <LogoutIcon />
                </button>
              </form>
            </div>
          ) : (
            <Link href="/register" className="text-xs font-medium text-sky-600 underline">
              Buat akun
            </Link>
          )}
        </header>

        {/* Horizontal scrollable categories with gradient fade */}
        <div className="relative -mx-5 px-5">
          <nav className="flex gap-2 overflow-x-auto pb-2 pr-6 
            [-webkit-overflow-scrolling:touch]
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/feed"
              className={`rounded-full px-3 py-1 text-xs flex-shrink-0 transition-colors ${
                !sp.cat ? "bg-sky-500 text-white" : "glass text-ink/70 hover:bg-sky-100"
              }`}
            >
              Semua
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/feed?cat=${c.slug}`}
                className={`rounded-full px-3 py-1 text-xs flex-shrink-0 transition-colors ${
                  sp.cat === c.slug ? "bg-sky-500 text-white" : "glass text-ink/70 hover:bg-sky-100"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </nav>

          {/* Smooth gradient fade on right edge - hints scrollable content */}
          <div className="absolute right-0 top-0 h-full w-12 
            bg-gradient-to-l from-white via-white/40 to-transparent 
            pointer-events-none" />
        </div>
      </div>

      {/* Quote box - non-sticky, visible on top */}
      <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-white/70">Pesan hari ini</p>
        <p className="mt-1 text-sm font-medium leading-relaxed">{quote}</p>
      </div>

      {!user && (
        <div className="glass rounded-2xl p-3 text-sm text-ink/70">
          Kamu lagi lihat-lihat sebagai tamu.{" "}
          <form action={guestAction} className="mt-2">
            <button className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-medium text-white">
              Masuk sebagai tamu untuk ikut peluk &amp; curhat
            </button>
          </form>
        </div>
      )}

      <FeedList
        initialPosts={posts}
        initialPeluked={[...peluked]}
        canReport={!!user}
        cat={sp.cat}
        pageSize={20}
      />

      {user && (
        <Link
          href="/compose"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30"
        >
          + Curhat
        </Link>
      )}
    </main>
  );
}
