"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { loadMoreFeed, pelukAction } from "@/app/feed/actions";
import { createClient } from "@/lib/supabase/client";
import { guestAction } from "@/app/auth/actions";
import { BellIcon, UserIcon, GearIcon, LogoutIcon } from "@/components/icons";
import type { Category, FeedPost } from "@/core/entities/post";

export function FeedShell({
  isLoggedIn,
  unread,
  categories,
  initialPosts,
  initialPeluked,
  initialCat,
  pageSize,
  quote,
}: {
  isLoggedIn: boolean;
  unread: number;
  categories: Category[];
  initialPosts: FeedPost[];
  initialPeluked: string[];
  initialCat?: string;
  pageSize: number;
  quote: string;
}) {
  const [cat, setCat] = useState<string | undefined>(initialCat);
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [peluked, setPeluked] = useState<Set<string>>(new Set(initialPeluked));
  const [offset, setOffset] = useState(initialPosts.length);
  const [hasMore, setHasMore] = useState(initialPosts.length >= pageSize);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Ganti kategori TANPA navigasi halaman (instan, ala IG).
  const selectCat = useCallback(
    async (next?: string) => {
      if (next === cat || switching) return;
      setSwitching(true);
      setCat(next);
      // sinkron URL tanpa reload (shareable + aman saat di-refresh)
      window.history.replaceState(null, "", next ? `/feed?cat=${next}` : "/feed");
      try {
        const res = await loadMoreFeed(next ?? null, 0, pageSize);
        setPosts(res.posts);
        setPeluked(new Set(res.peluked));
        setOffset(res.posts.length);
        setHasMore(res.posts.length >= pageSize);
        window.scrollTo({ top: 0 });
      } catch {
        setHasMore(false);
      } finally {
        setSwitching(false);
      }
    },
    [cat, switching, pageSize]
  );

  const loadMore = useCallback(async () => {
    if (loading || switching || !hasMore) return;
    setLoading(true);
    try {
      const res = await loadMoreFeed(cat ?? null, offset, pageSize);
      setPosts((prev) => [...prev, ...res.posts]);
      setPeluked((prev) => {
        const n = new Set(prev);
        res.peluked.forEach((id) => n.add(id));
        return n;
      });
      setOffset((o) => o + res.posts.length);
      setHasMore(res.posts.length >= pageSize);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, switching, hasMore, cat, offset, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const [, startTransition] = useTransition();
  // Tandai aksi peluk dari device ini biar echo realtime-nya ga dihitung dobel.
  const recentSelf = useRef<Map<string, number>>(new Map());

  const bumpCount = useCallback((postId: string, delta: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, pelukCount: Math.max(0, p.pelukCount + delta) }
          : p
      )
    );
  }, []);

  const onToggle = useCallback(
    (postId: string) => {
      const was = peluked.has(postId);
      recentSelf.current.set(`${postId}:${was ? "del" : "add"}`, Date.now());
      // optimistic (instan di device ini)
      setPeluked((prev) => {
        const n = new Set(prev);
        if (was) n.delete(postId);
        else n.add(postId);
        return n;
      });
      bumpCount(postId, was ? -1 : 1);
      startTransition(async () => {
        try {
          await pelukAction(postId, was);
        } catch {
          // revert kalau gagal
          setPeluked((prev) => {
            const n = new Set(prev);
            if (was) n.add(postId);
            else n.delete(postId);
            return n;
          });
          bumpCount(postId, was ? 1 : -1);
        }
      });
    },
    [peluked, bumpCount]
  );

  // Realtime cross-device: dengerin perubahan tabel reactions.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("reactions-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions" },
        (payload) => {
          const postId = (payload.new as { post_id?: string })?.post_id;
          if (!postId) return;
          const key = `${postId}:add`;
          const t = recentSelf.current.get(key);
          if (t && Date.now() - t < 6000) {
            recentSelf.current.delete(key); // echo dari device ini, abaikan
            return;
          }
          bumpCount(postId, 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reactions" },
        (payload) => {
          const postId = (payload.old as { post_id?: string })?.post_id;
          if (!postId) return;
          const key = `${postId}:del`;
          const t = recentSelf.current.get(key);
          if (t && Date.now() - t < 6000) {
            recentSelf.current.delete(key);
            return;
          }
          bumpCount(postId, -1);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [bumpCount]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs flex-shrink-0 transition-colors ${
      active ? "bg-sky-500 text-white" : "glass text-ink/70 hover:bg-sky-100"
    }`;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-50 -mx-5 -mt-6 flex flex-col gap-4 bg-white px-5 py-6 shadow-sm">
        <header className="flex items-center justify-between">
          <ScrollToTopButton />

          {isLoggedIn ? (
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

        {/* Kategori: tombol client (filter tanpa navigasi) */}
        <div className="relative -mx-5 px-5">
          <nav className="flex gap-2 overflow-x-auto pb-2 pr-6 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button type="button" onClick={() => selectCat(undefined)} className={pill(!cat)}>
              Semua
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCat(c.slug)}
                className={pill(cat === c.slug)}
              >
                {c.name}
              </button>
            ))}
          </nav>
          <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white via-white/40 to-transparent pointer-events-none" />
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-white/70">Pesan hari ini</p>
        <p className="mt-1 text-sm font-medium leading-relaxed">{quote}</p>
        <Link
          href="/edukasi"
          className="mt-3 inline-block text-xs font-medium text-white/90 underline"
        >
          Tips relaksasi &amp; kesehatan mental →
        </Link>
      </div>

      {!isLoggedIn && (
        <div className="glass rounded-2xl p-3 text-sm text-ink/70">
          Kamu lagi lihat-lihat sebagai tamu.{" "}
          <form action={guestAction} className="mt-2">
            <button className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-medium text-white">
              Masuk sebagai tamu untuk ikut peluk &amp; curhat
            </button>
          </form>
        </div>
      )}

      <div
        className={`flex flex-col gap-3 transition-opacity duration-150 ${
          switching ? "opacity-40" : "opacity-100"
        }`}
      >
        {posts.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/40">
            Belum ada curhat di sini. Jadi yang pertama?
          </p>
        ) : (
          posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              peluked={peluked.has(p.id)}
              canReport={isLoggedIn}
              onToggle={() => onToggle(p.id)}
            />
          ))
        )}
        {hasMore && (
          <div
            ref={sentinelRef}
            className="py-6 text-center text-xs text-ink/30"
            aria-hidden="true"
          >
            {loading ? "Memuat..." : ""}
          </div>
        )}
      </div>

      {isLoggedIn && (
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
