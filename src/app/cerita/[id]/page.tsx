import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { createPublicClient } from "@/lib/supabase/public";
import { CRISIS_RESOURCE } from "@/core/crisisResources";
import { StoryPeluk } from "@/components/StoryPeluk";
import { StoryReactions } from "@/components/StoryReactions";
import { CommentForm } from "@/components/CommentForm";
import { GuestPrompt } from "@/components/GuestPrompt";
import { ShareButton } from "@/components/ShareButton";
import { commentStoryAction, deleteStoryAction } from "@/app/cerita/actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("stories")
    .select("title, summary")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { title: "Cerita", robots: { index: false, follow: true } };
  const desc = ((data.summary as string) ?? "").slice(0, 160) || "Cerita di Soulpace.";
  const url = `https://soulpace.vercel.app/cerita/${id}`;
  return {
    title: data.title as string,
    description: desc,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: { title: data.title as string, description: desc, type: "article", url },
  };
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Story = {
  id: string;
  author_id: string;
  title: string;
  summary: string;
  content_warning: string | null;
  created_at: string;
  peluk_boost: number;
  profiles: { handle: string } | null;
};
type Episode = { id: string; episode_number: number; title: string; views: number; created_at: string };
type Comment = {
  id: string;
  body: string;
  crisis_flag: boolean;
  created_at: string;
  profiles: { handle: string } | null;
};

export default async function CeritaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: storyData, error: storyErr } = await supabase
    .from("stories")
    .select("id, author_id, title, summary, content_warning, created_at, peluk_boost")
    .eq("id", id)
    .maybeSingle();
  if (storyErr) console.error("[cerita-detail] story error:", storyErr.message);

  if (!storyData) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
        <Link href="/cerita" className="text-sm text-ink/50">← Kembali</Link>
        <p className="py-10 text-center text-sm text-ink/40">Cerita tidak ditemukan.</p>
      </main>
    );
  }
  const { data: authorProf } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", storyData.author_id)
    .maybeSingle();
  const story = { ...storyData, profiles: authorProf ?? null } as unknown as Story;
  const isOwner = !!user && user.id === story.author_id;

  const { data: epsData } = await supabase
    .from("story_episodes")
    .select("id, episode_number, title, views, created_at")
    .eq("story_id", id)
    .order("episode_number", { ascending: true });
  const episodes = (epsData ?? []) as Episode[];

  const { data: cmtData, error: cmtErr } = await supabase
    .from("story_comments")
    .select("id, body, crisis_flag, created_at, author_id")
    .eq("story_id", id)
    .order("created_at", { ascending: true });
  if (cmtErr) console.error("[cerita-detail] comments error:", cmtErr.message);
  const cmtRows = (cmtData ?? []) as { id: string; body: string; crisis_flag: boolean; created_at: string; author_id: string }[];
  const cmtAuthorIds = Array.from(new Set(cmtRows.map((c) => c.author_id)));
  const cmtHandles: Record<string, string> = {};
  if (cmtAuthorIds.length > 0) {
    const { data: cmtProfs } = await supabase.from("profiles").select("id, handle").in("id", cmtAuthorIds);
    (cmtProfs ?? []).forEach((p: { id: string; handle: string }) => { cmtHandles[p.id] = p.handle; });
  }
  const comments = cmtRows.map((c) => ({ ...c, profiles: cmtHandles[c.author_id] ? { handle: cmtHandles[c.author_id] } : null })) as unknown as Comment[];

  const { count: pelukCount } = await supabase
    .from("story_peluk")
    .select("*", { count: "exact", head: true })
    .eq("story_id", id);

  let peluked = false;
  if (user) {
    const { data: pk } = await supabase
      .from("story_peluk")
      .select("id")
      .eq("story_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    peluked = !!pk;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <Link href="/cerita" className="text-sm text-ink/50">← Semua cerita</Link>
        {isOwner && (
          <div className="flex items-center gap-3">
            <Link
              href={`/cerita/${story.id}/edit`}
              className="text-xs font-medium text-sky-600 hover:underline"
            >
              Edit
            </Link>
            <form action={deleteStoryAction}>
              <input type="hidden" name="id" value={story.id} />
              <button className="text-xs font-medium text-rose-500 hover:underline">Hapus</button>
            </form>
          </div>
        )}
      </header>

      <div>
        <h1 className="text-2xl font-bold text-ink">{story.title}</h1>
        <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink/45">
          <span>oleh {story.profiles?.handle ?? "Anonim"}</span>
          <span>{fmt(story.created_at)}</span>
        </p>
      </div>

      {story.content_warning && (
        <div className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          ⚠ Peringatan isi sensitif: {story.content_warning}. Baca kalau kamu merasa siap.
        </div>
      )}

      {story.summary && (
        <p className="text-sm leading-relaxed text-ink/75">{story.summary}</p>
      )}

      <div className="flex items-center gap-3">
        <StoryPeluk storyId={story.id} initialPeluked={peluked} initialCount={(pelukCount ?? 0) + (story.peluk_boost ?? 0)} />
        <ShareButton path={`/cerita/${story.id}`} title={story.title} />
      </div>

      {/* Episode */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Episode</h2>
          {isOwner && (
            <Link
              href={`/cerita/${story.id}/tulis`}
              className="rounded-full bg-sky-500 px-3 py-1.5 text-xs font-medium text-white"
            >
              + Tambah episode
            </Link>
          )}
        </div>
        {episodes.length === 0 ? (
          <p className="text-sm text-ink/40">Belum ada episode.</p>
        ) : (
          episodes.map((e) => (
            <Link
              key={e.id}
              href={`/cerita/${story.id}/${e.id}`}
              className="glass block rounded-xl p-3 text-sm transition-colors hover:bg-sky-50"
            >
              <p className="text-sm">
                <span className="font-medium text-ink">Episode {e.episode_number}</span>
                {e.title && <span className="text-ink/70">  {e.title}</span>}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-ink/40">
                <span>{fmt(e.created_at)}</span>
                <span className="inline-flex items-center gap-1">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  {e.views} dibaca
                </span>
              </p>
            </Link>
          ))
        )}
      </section>

      <StoryReactions storyId={story.id} />

      {/* Komentar */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink">Komentar ({comments.length})</h2>
        {user ? (
          <CommentForm storyId={story.id} action={commentStoryAction} />
        ) : (
          <p className="text-sm text-ink/50">
            <Link href="/login" className="text-sky-600 underline">Masuk</Link> untuk ikut komentar.
          </p>
        )}

        {comments.map((c) => (
          <div key={c.id} className="glass rounded-xl p-3">
            <p className="flex flex-wrap gap-x-3 text-xs text-ink/45">
              <span>{c.profiles?.handle ?? "Anonim"}</span>
              <span>{fmt(c.created_at)}</span>
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/85">{c.body}</p>
            {c.crisis_flag && (
              <p className="mt-2 text-[11px] leading-relaxed text-ink/60">
                {CRISIS_RESOURCE.message} Telepon {CRISIS_RESOURCE.phone} (SEJIWA, 24 jam).
              </p>
            )}
          </div>
        ))}
      </section>
      <GuestPrompt isGuest={!user} />
    </main>
  );
}
