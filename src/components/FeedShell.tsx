"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { loadMoreFeed, pelukAction } from "@/app/feed/actions";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
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
  stories,
}: {
  isLoggedIn: boolean;
  unread: number;
  categories: Category[];
  initialPosts: FeedPost[];
  initialPeluked: string[];
  initialCat?: string;
  pageSize: number;
  quote: string;
  stories: {
    id: string;
    title: string;
    snippet: string;
    contentWarning: string | null;
    date: string;
    handle: string;
    episodes: number;
    views: number;
    peluk: number;
    comments: number;
  }[];
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
  const channelRef = useRef<RealtimeChannel | null>(null);

  const bumpCount = useCallback((postId: string, delta: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, pelukCount: Math.max(0, p.pelukCount + delta) }
          : p
      )
    );
  }, []);

  // Realtime cross-device pakai BROADCAST (bukan postgres_changes).
  // Ga bergantung replica identity / RLS, dan jalan sama buat peluk & un-peluk.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("peluk-sync", {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "peluk" }, ({ payload }) => {
        const postId = (payload as { postId?: string })?.postId;
        const delta = (payload as { delta?: number })?.delta;
        if (postId && typeof delta === "number") bumpCount(postId, delta);
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [bumpCount]);

  const onToggle = useCallback(
    (postId: string) => {
      const was = peluked.has(postId);
      const delta = was ? -1 : 1;
      // optimistic (instan di device ini)
      setPeluked((prev) => {
        const n = new Set(prev);
        if (was) n.delete(postId);
        else n.add(postId);
        return n;
      });
      bumpCount(postId, delta);
      startTransition(async () => {
        try {
          await pelukAction(postId, was);
          // sebar ke device lain (self:false -> device ini ga nerima balik)
          channelRef.current?.send({
            type: "broadcast",
            event: "peluk",
            payload: { postId, delta },
          });
        } catch {
          // revert kalau gagal
          setPeluked((prev) => {
            const n = new Set(prev);
            if (was) n.add(postId);
            else n.delete(postId);
            return n;
          });
          bumpCount(postId, -delta);
        }
      });
    },
    [peluked, bumpCount]
  );

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
                href="/panduan"
                aria-label="Panduan & FAQ"
                title="Panduan & FAQ"
                className="transition-colors hover:text-sky-600"
              >
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </Link>
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

        {/* Tools wellness: gaya shortcut (ikon + label) biar beda jelas dari filter */}
        <div className="flex gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { href: "/cerita", icon: "📖", label: "Cerita" },
            { href: "/mood", icon: "🙂", label: "Mood" },
            { href: "/syukur", icon: "🙏", label: "Syukur" },
            { href: "/jurnal", icon: "📓", label: "Jurnal" },
            { href: "/surat", icon: "✉️", label: "Surat" },
            { href: "/edukasi", icon: "💡", label: "Tips" },
            { href: "/skrining", icon: "📋", label: "Skrining" },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="flex w-[60px] shrink-0 flex-col items-center gap-1 rounded-xl py-1.5 text-ink/70 transition-colors hover:bg-sky-50"
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="text-[10px] font-medium">{t.label}</span>
            </Link>
          ))}
        </div>

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
      </div>

      {stories.length > 0 && (
        <section className="rounded-2xl border border-sky-100 bg-white/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">📖 Cerita</h2>
            <Link href="/cerita" className="text-xs font-medium text-sky-600 hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-ink/5">
            {stories.map((s) => (
              <Link
                key={s.id}
                href={`/cerita/${s.id}`}
                className="group block py-2.5 first:pt-0 last:pb-0"
              >
                <p className="text-sm font-semibold text-ink group-hover:text-sky-600">
                  {s.title}
                </p>
                {s.contentWarning && (
                  <p className="text-[11px] font-medium text-amber-700">⚠ {s.contentWarning}</p>
                )}
                <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-ink/65">
                  {s.snippet}
                </p>
                <div className="mt-1.5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                  <p className="text-xs leading-relaxed text-ink/45">
                    oleh {s.handle} · {s.date} · {s.episodes} episode · {s.views} dibaca · {s.peluk}{" "}
                    peluk · {s.comments} komentar
                  </p>
                  <span className="shrink-0 self-end text-xs font-medium text-sky-600 group-hover:underline sm:self-auto">
                    Baca selengkapnya →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
