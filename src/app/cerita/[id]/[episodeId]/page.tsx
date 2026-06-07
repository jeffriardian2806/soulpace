import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { CRISIS_RESOURCE } from "@/core/crisisResources";
import { ShareButton } from "@/components/ShareButton";
import { Markdown } from "@/components/Markdown";
import { EpisodeView } from "@/components/EpisodeView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; episodeId: string }>;
}): Promise<Metadata> {
  const { id, episodeId } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("story_episodes")
    .select("title, episode_number, body, story_id")
    .eq("id", episodeId)
    .maybeSingle();
  if (!data) return { title: "Episode", robots: { index: false, follow: true } };
  const { data: storyMeta } = await supabase
    .from("stories")
    .select("title")
    .eq("id", data.story_id)
    .maybeSingle();
  const storyTitle = (storyMeta?.title as string) ?? "Cerita";
  const epExtra = (data.title as string) ? `: ${data.title}` : "";
  const title = `${storyTitle} · Episode ${data.episode_number}${epExtra}`;
  const desc =
    ((data.body as string) ?? "").replace(/\s+/g, " ").slice(0, 160) || "Cerita di Soulpace.";
  const url = `https://soulpace.vercel.app/cerita/${id}/${episodeId}`;
  return {
    title,
    description: desc,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: { title, description: desc, type: "article", url },
  };
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Ep = {
  id: string;
  episode_number: number;
  title: string;
  body: string;
  crisis_flag: boolean;
  story_id: string;
  author_id: string;
  created_at: string;
  views: number;
  profiles: { handle: string } | null;
};

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ id: string; episodeId: string }>;
}) {
  const { id, episodeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: epData, error: epErr } = await supabase
    .from("story_episodes")
    .select(
      "id, episode_number, title, body, crisis_flag, story_id, author_id, created_at, views"
    )
    .eq("id", episodeId)
    .eq("story_id", id)
    .maybeSingle();
  if (epErr) console.error("[episode] error:", epErr.message);

  if (!epData) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
        <Link href={`/cerita/${id}`} className="text-sm text-ink/50">← Kembali</Link>
        <p className="py-10 text-center text-sm text-ink/40">Episode tidak ditemukan.</p>
      </main>
    );
  }
  const { data: epAuthor } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", epData.author_id)
    .maybeSingle();
  const ep = { ...epData, profiles: epAuthor ?? null } as unknown as Ep;

  const { data: siblings } = await supabase
    .from("story_episodes")
    .select("id, episode_number")
    .eq("story_id", id)
    .order("episode_number", { ascending: true });
  const list = (siblings ?? []) as { id: string; episode_number: number }[];
  const idx = list.findIndex((s) => s.id === ep.id);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  const isOwner = !!user && user.id === ep.author_id;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <EpisodeView episodeId={ep.id} />
      <header className="flex items-center justify-between gap-3">
        <Link href={`/cerita/${id}`} className="text-sm text-ink/50">← Daftar episode</Link>
        <div className="flex items-center gap-3">
          <ShareButton path={`/cerita/${id}/${ep.id}`} title={ep.title || `Episode ${ep.episode_number}`} />
          {isOwner && (
            <Link
              href={`/cerita/${id}/${ep.id}/edit`}
              className="text-xs font-medium text-sky-600 hover:underline"
            >
              Edit episode
            </Link>
          )}
        </div>
      </header>

      <div>
        <p className="text-xs font-medium text-sky-600">Episode {ep.episode_number}</p>
        {ep.title && <h1 className="mt-0.5 text-xl font-bold text-ink">{ep.title}</h1>}
        <p className="mt-1 text-xs text-ink/45">
          oleh {ep.profiles?.handle ?? "Anonim"} · {fmt(ep.created_at)} · {ep.views} dibaca
        </p>
      </div>

      {ep.crisis_flag && (
        <div className="rounded-xl bg-sky-50 p-3 text-xs leading-relaxed text-ink/70">
          {CRISIS_RESOURCE.message} Telepon{" "}
          <span className="font-semibold text-ink/80">{CRISIS_RESOURCE.phone}</span> (SEJIWA,
          gratis 24 jam) atau{" "}
          <a
            href={CRISIS_RESOURCE.url}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="font-medium text-sky-600 underline"
          >
            healing119.id
          </a>
          .
        </div>
      )}

      <article className="text-sm leading-relaxed text-ink/85">
        <Markdown>{ep.body}</Markdown>
      </article>

      <div className="mt-2 flex items-center justify-between border-t border-ink/5 pt-4 text-sm">
        {prev ? (
          <Link href={`/cerita/${id}/${prev.id}`} className="text-sky-600 hover:underline">
            ← Episode {prev.episode_number}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/cerita/${id}/${next.id}`} className="text-sky-600 hover:underline">
            Episode {next.episode_number} →
          </Link>
        ) : (
          <span className="text-ink/40">Tamat</span>
        )}
      </div>
    </main>
  );
}
