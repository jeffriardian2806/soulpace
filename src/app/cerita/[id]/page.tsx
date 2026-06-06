import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { CRISIS_RESOURCE } from "@/core/crisisResources";
import { StoryPeluk } from "@/components/StoryPeluk";
import { StoryReactions } from "@/components/StoryReactions";
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

  const { data: storyData } = await supabase
    .from("stories")
    .select("id, author_id, title, summary, content_warning, created_at, peluk_boost, profiles!inner(handle)")
    .eq("id", id)
    .maybeSingle();

  if (!storyData) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
        <Link href="/cerita" className="text-sm text-ink/50">← Kembali</Link>
        <p className="py-10 text-center text-sm text-ink/40">Cerita tidak ditemukan.</p>
      </main>
    );
  }
  const story = storyData as unknown as Story;
  const isOwner = !!user && user.id === story.author_id;

  const { data: epsData } = await supabase
    .from("story_episodes")
    .select("id, episode_number, title, views, created_at")
    .eq("story_id", id)
    .order("episode_number", { ascending: true });
  const episodes = (epsData ?? []) as Episode[];

  const { data: cmtData } = await supabase
    .from("story_comments")
    .select("id, body, crisis_flag, created_at, profiles!inner(handle)")
    .eq("story_id", id)
    .order("created_at", { ascending: true });
  const comments = (cmtData ?? []) as unknown as Comment[];

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
        <p className="mt-1 text-xs text-ink/45">
          oleh {story.profiles?.handle ?? "Anonim"} · {fmt(story.created_at)}
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
        {isOwner && (
          <Link
            href={`/cerita/${story.id}/tulis`}
            className="rounded-full bg-sky-500 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Tambah episode
          </Link>
        )}
      </div>

      <StoryReactions storyId={story.id} />

      {/* Episode */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold text-ink">Episode</h2>
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
                {e.title && <span className="text-ink/70"> · {e.title}</span>}
              </p>
              <p className="mt-0.5 text-xs text-ink/40">{fmt(e.created_at)} · {e.views} dibaca</p>
            </Link>
          ))
        )}
      </section>

      {/* Komentar */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink">Komentar ({comments.length})</h2>
        {user ? (
          <form action={commentStoryAction} className="flex flex-col gap-2">
            <input type="hidden" name="story_id" value={story.id} />
            <textarea
              name="body"
              required
              rows={2}
              maxLength={2000}
              placeholder="Tulis komentar yang suportif..."
              className="rounded-xl border border-ink/10 bg-white/60 p-2.5 text-sm text-ink outline-none focus:border-sky-300"
            />
            <button className="self-start rounded-xl bg-sky-500 px-4 py-1.5 text-sm font-medium text-white">
              Kirim
            </button>
          </form>
        ) : (
          <p className="text-sm text-ink/50">
            <Link href="/login" className="text-sky-600 underline">Masuk</Link> untuk ikut komentar.
          </p>
        )}

        {comments.map((c) => (
          <div key={c.id} className="glass rounded-xl p-3">
            <p className="text-xs text-ink/45">
              {c.profiles?.handle ?? "Anonim"} · {fmt(c.created_at)}
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
    </main>
  );
}
