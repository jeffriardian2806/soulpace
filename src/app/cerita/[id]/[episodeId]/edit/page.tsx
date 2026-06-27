import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateEpisodeAction } from "@/app/cerita/actions";

export const metadata = { title: "Edit Episode — Flouwell" };

export default async function EditEpisodePage({
  params,
}: {
  params: Promise<{ id: string; episodeId: string }>;
}) {
  const { id, episodeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ep } = await supabase
    .from("story_episodes")
    .select("id, story_id, author_id, episode_number, title, body")
    .eq("id", episodeId)
    .eq("story_id", id)
    .maybeSingle();
  if (!ep || ep.author_id !== user.id) redirect(`/cerita/${id}`);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href={`/cerita/${id}/${episodeId}`} className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-medium text-ink">Edit Episode {ep.episode_number as number}</h1>
      </header>
      <form action={updateEpisodeAction} className="flex flex-col gap-3">
        <input type="hidden" name="episode_id" value={ep.id as string} />
        <input type="hidden" name="story_id" value={id} />
        <input
          name="title"
          maxLength={200}
          defaultValue={(ep.title as string) ?? ""}
          placeholder="Judul episode (opsional)"
          className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm text-ink outline-none focus:border-sky-300"
        />
        <textarea
          name="body"
          required
          rows={16}
          defaultValue={ep.body as string}
          className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm leading-relaxed text-ink outline-none focus:border-sky-300"
        />
        <button className="rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
          Simpan perubahan
        </button>
      </form>
    </main>
  );
}
