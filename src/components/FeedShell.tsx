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
import { MoodCheckIn } from "@/components/MoodCheckIn";

const STATUS_OPTIONS = [
  { slug: "semua", label: "Semua" },
  { slug: "unanswered", label: "Belum dibalas" },
  { slug: "didengar", label: "Butuh Didengar" },
  { slug: "peluk", label: "Butuh Peluk" },
  { slug: "saran", label: "Butuh Saran" },
];
const WISH_SLUGS = ["didengar", "peluk", "saran"];

export function FeedShell({
  isLoggedIn,
  currentUserId,
  unread,
  categories,
  initialPosts,
  initialPeluked,
  initialCat,
  initialStatus,
  pageSize,
  quote,
  stories,
}: {
  isLoggedIn: boolean;
  currentUserId: string | null;
  unread: number;
  categories: Category[];
  initialPosts: FeedPost[];
  initialPeluked: string[];
  initialCat?: string;
  initialStatus?: string;
  pageSize: number;
  quote: string;
  stories: {
    id: string;
    label: string;
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
  const [status, setStatus] = useState<string>(initialStatus ?? "semua");
  const [sheetMode, setSheetMode] = useState<"status" | "kategori" | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [peluked, setPeluked] = useState<Set<string>>(new Set(initialPeluked));
  const [offset, setOffset] = useState(initialPosts.length);
  const [hasMore, setHasMore] = useState(initialPosts.length >= pageSize);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reload feed dari awal (ganti kategori / mode) TANPA navigasi halaman.
  const reload = useCallback(
    async (nextCat: string | undefined, nextStatus: string) => {
      setSwitching(true);
      setCat(nextCat);
      setStatus(nextStatus);
      setSheetMode(null);
      window.history.replaceState(null, "", nextCat ? `/feed?cat=${nextCat}` : "/feed");
      const unanswered = nextStatus === "unanswered";
      const wish = WISH_SLUGS.includes(nextStatus) ? nextStatus : undefined;
      try {
        const res = await loadMoreFeed(nextCat ?? null, 0, pageSize, unanswered, wish);
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
    [pageSize]
  );

  const selectCat = useCallback(
    (next?: string) => {
      if (next === cat) {
        setSheetMode(null);
        return;
      }
      reload(next, status);
    },
    [cat, status, reload]
  );

  const selectStatus = useCallback(
    (next: string) => {
      if (next === status) {
        setSheetMode(null);
        return;
      }
      reload(cat, next);
    },
    [status, cat, reload]
  );

  const loadMore = useCallback(async () => {
    if (loading || switching || !hasMore) return;
    setLoading(true);
    try {
      const unanswered = status === "unanswered";
      const wish = WISH_SLUGS.includes(status) ? status : undefined;
      const res = await loadMoreFeed(cat ?? null, offset, pageSize, unanswered, wish);
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
  }, [loading, switching, hasMore, cat, offset, pageSize, status]);

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

  const statusLabel = STATUS_OPTIONS.find((o) => o.slug === status)?.label ?? "Semua";
  const catLabel = cat
    ? categories.find((c) => c.slug === cat)?.name ?? "Kategori"
    : "Kategori";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 pb-28 pt-6">
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
            { href: "/main", icon: "✨", label: "Main" },
            { href: "/cerita", icon: "📖", label: "Cerita" },
            { href: "/mood", icon: "🙂", label: "Mood" },
            { href: "/syukur", icon: "🙏", label: "Syukur" },
            { href: "/hening", icon: "🌙", label: "Hening" },
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

      </div>

      <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-white/70">Pesan hari ini</p>
        <p className="mt-1 text-sm font-medium leading-relaxed">{quote}</p>
      </div>

      <MoodCheckIn onPosted={() => reload(cat, status)} />

      {status === "unanswered" && (
        <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm leading-relaxed text-ink/70">
          Ada yang belum didengar. Balasan kecil darimu bisa bikin hari seseorang terasa lebih
          ringan. 💙
        </p>
      )}

      {stories.length > 0 && (
        <section className="rounded-2xl border border-sky-100 bg-white/70 p-4">
          <div className="mb-3 flex items-center justify-between">
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
                className="group block py-3 first:pt-0 last:pb-0"
              >
                <span className="mb-1.5 inline-block rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-600">
                  {s.label}
                </span>
                <p className="text-sm font-semibold text-ink group-hover:text-sky-600">
                  {s.title}
                </p>
                <div className="mt-1 flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-xs text-ink/45">
                  <span>oleh {s.handle}</span>
                  <span>{s.date}</span>
                  <span>{s.episodes} episode</span>
                </div>
                {s.contentWarning && (
                  <p className="mt-1.5 text-[11px] font-medium text-amber-700">
                    ⚠ {s.contentWarning}
                  </p>
                )}
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/65">
                  {s.snippet}
                </p>
                <p className="mt-1 text-xs font-medium text-sky-600 group-hover:underline">
                  Baca selengkapnya →
                </p>
                <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-xs text-ink/45">
                  <span>{s.views} dibaca</span>
                  <span>{s.peluk} peluk</span>
                  <span>{s.comments} komentar</span>
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
              currentUserId={currentUserId}
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

      {/* Bottom sticky bar: filter status · curhat · filter kategori */}
      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-2xl -translate-x-1/2 border-t border-sky-100 bg-white/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSheetMode("status")}
            className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full glass px-3 py-2.5 text-xs font-medium text-ink/70"
          >
            <span className="truncate">{statusLabel}</span>
            <span className="text-ink/40">▾</span>
          </button>
          <Link
            href="/compose"
            className="shrink-0 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30"
          >
            + Curhat
          </Link>
          <button
            type="button"
            onClick={() => setSheetMode("kategori")}
            className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full glass px-3 py-2.5 text-xs font-medium text-ink/70"
          >
            <span className="truncate">{catLabel}</span>
            <span className="text-ink/40">▾</span>
          </button>
        </div>
      </div>

      {/* Bottom sheet filter */}
      {sheetMode && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSheetMode(null)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-1/2 w-full max-w-2xl -translate-x-1/2 rounded-t-3xl bg-white p-5 pb-8 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink/15" />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">
                {sheetMode === "status" ? "Status & Kebutuhan" : "Kategori"}
              </h3>
              <button
                type="button"
                onClick={() => setSheetMode(null)}
                aria-label="Tutup"
                className="text-lg text-ink/40"
              >
                ✕
              </button>
            </div>

            {sheetMode === "status" ? (
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.slug}
                    type="button"
                    onClick={() => selectStatus(o.slug)}
                    className={pill(status === o.slug)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
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
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
