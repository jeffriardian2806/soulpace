"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PostCard } from "@/components/PostCard";
import { loadMoreFeed } from "@/app/feed/actions";
import type { FeedPost } from "@/core/entities/post";

export function FeedList({
  initialPosts,
  initialPeluked,
  canReport,
  cat,
  pageSize,
}: {
  initialPosts: FeedPost[];
  initialPeluked: string[];
  canReport: boolean;
  cat?: string;
  pageSize: number;
}) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [peluked, setPeluked] = useState<Set<string>>(new Set(initialPeluked));
  const [offset, setOffset] = useState(initialPosts.length);
  const [hasMore, setHasMore] = useState(initialPosts.length >= pageSize);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset state when category changes
  useEffect(() => {
    setPosts(initialPosts);
    setPeluked(new Set(initialPeluked));
    setOffset(initialPosts.length);
    setHasMore(initialPosts.length >= pageSize);
  }, [cat, initialPosts, initialPeluked, pageSize]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await loadMoreFeed(cat ?? null, offset, pageSize);
      setPosts((prev) => [...prev, ...res.posts]);
      setPeluked((prev) => {
        const next = new Set(prev);
        res.peluked.forEach((id) => next.add(id));
        return next;
      });
      setOffset((o) => o + res.posts.length);
      setHasMore(res.posts.length >= pageSize);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset, cat, pageSize]);

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

  if (posts.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ink/40">
        Belum ada curhat di sini. Jadi yang pertama?
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          peluked={peluked.has(p.id)}
          canReport={canReport}
        />
      ))}
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
  );
}
