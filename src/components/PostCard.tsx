"use client";

import { useTransition } from "react";
import Link from "next/link";
import { pelukAction } from "@/app/feed/actions";
import { createReportAction } from "@/app/_actions/report";
import { PostMenu } from "@/components/PostMenu";
import { CRISIS_RESOURCE } from "@/core/crisisResources";
import { getMood, getWish } from "@/core/moods";
import type { FeedPost } from "@/core/entities/post";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

export function PostCard({
  post,
  peluked,
  canReport = false,
  onToggle,
  currentUserId = null,
}: {
  post: FeedPost;
  peluked: boolean;
  canReport?: boolean;
  onToggle?: () => void;
  currentUserId?: string | null;
}) {
  const [, startTransition] = useTransition();
  const mood = getMood(post.mood);
  const wish = getWish(post.wish);
  const isOwner = !!currentUserId && currentUserId === post.authorId;
  const ageMin = (Date.now() - new Date(post.createdAt).getTime()) / 60000;
  const canEdit = isOwner && ageMin <= 15 && post.replyCount === 0;
  // Di feed, onToggle dikontrol FeedShell (optimistic + realtime).
  // Di halaman lain (detail/profil), fallback panggil server action langsung.
  const handleToggle =
    onToggle ??
    (() => {
      startTransition(() => {
        void pelukAction(post.id, peluked);
      });
    });
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
          {post.authorHandle.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{post.authorHandle}</p>
          <p className="flex flex-wrap gap-x-3 text-xs text-ink/45" suppressHydrationWarning>
            <span>{timeAgo(post.createdAt)}</span>
            {post.categoryName && <span>{post.categoryName}</span>}
            {post.editedAt && <span>diedit</span>}
          </p>
        </div>
        <PostMenu
          postId={post.id}
          canEdit={canEdit}
          canReport={canReport}
          reportAction={createReportAction}
        />
      </div>

      {(mood || wish) && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {mood && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
              <span className="leading-none">{mood.emoji}</span>
              {mood.label}
            </span>
          )}
          {wish && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
              <span className="leading-none">{wish.emoji}</span>
              {wish.label}
            </span>
          )}
        </div>
      )}

      <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
        {post.body}
      </p>

      {post.crisisFlag && (
        <div className="mb-3 rounded-xl bg-sky-50 p-3 text-xs leading-relaxed text-ink/70">
          {CRISIS_RESOURCE.message} Telepon{" "}
          <span className="font-semibold text-ink/80">{CRISIS_RESOURCE.phone}</span>{" "}
          (SEJIWA, gratis 24 jam) atau{" "}
          <a
            href={CRISIS_RESOURCE.url}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="font-medium text-sky-600 underline"
          >
            kunjungi healing119.id
          </a>
          .
        </div>
      )}

      <div className="flex items-center gap-5 text-sm text-ink/55">
        <button
          type="button"
          onClick={handleToggle}
          aria-pressed={peluked}
          aria-label={peluked ? "Batalkan peluk" : "Beri peluk"}
          className={`flex items-center gap-1.5 transition-colors ${
            peluked ? "font-semibold text-sky-600" : "hover:text-sky-600"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill={peluked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          <span>Peluk</span>
          <span className="tabular-nums">{post.pelukCount}</span>
        </button>

        <Link
          href={`/post/${post.id}`}
          className="flex items-center gap-1.5 hover:text-sky-600"
        >
          <span aria-hidden="true" className="text-base leading-none">💬</span>
          <span>Balasan</span>
          <span className="tabular-nums">{post.replyCount}</span>
        </Link>

        <Link
          href={`/share/${post.id}`}
          className="flex items-center gap-1.5 hover:text-sky-600"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M13 4l8 7-8 7v-4c-6 0-9 2-12 6 1-7 5-11 12-12V4z" fill="currentColor" />
          </svg>
          <span>Bagikan</span>
        </Link>
      </div>
    </div>
  );
}
