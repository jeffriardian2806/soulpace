import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CRISIS_RESOURCE } from "@/core/crisisResources";

export const metadata = { title: "Episode — Soulpace" };

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ id: string; episodeId: string }>;
}) {
  const { id, episodeId } = await params;
  const supabase = await createClient();

  const { data: ep } = await supabase
    .from("story_episodes")
    .select("id, episode_number, title, body, crisis_flag, story_id")
    .eq("id", episodeId)
    .eq("story_id", id)
    .maybeSingle();

  if (!ep) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
        <Link href={`/cerita/${id}`} className="text-sm text-ink/50">← Kembali</Link>
        <p className="py-10 text-center text-sm text-ink/40">Episode tidak ditemukan.</p>
      </main>
    );
  }

  const { data: siblings } = await supabase
    .from("story_episodes")
    .select("id, episode_number")
    .eq("story_id", id)
    .order("episode_number", { ascending: true });
  const list = (siblings ?? []) as { id: string; episode_number: number }[];
  const idx = list.findIndex((s) => s.id === ep.id);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href={`/cerita/${id}`} className="text-sm text-ink/50">← Daftar episode</Link>
      </header>

      <div>
        <p className="text-xs font-medium text-sky-600">Episode {ep.episode_number}</p>
        {ep.title && <h1 className="mt-0.5 text-xl font-bold text-ink">{ep.title as string}</h1>}
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

      <article className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
        {ep.body as string}
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
