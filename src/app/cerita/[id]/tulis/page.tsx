import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addEpisodeAction } from "@/app/cerita/actions";

export const metadata = { title: "Tambah Episode — Flouwell" };

export default async function TulisEpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: story } = await supabase
    .from("stories")
    .select("id, title, author_id")
    .eq("id", id)
    .maybeSingle();
  if (!story || story.author_id !== user.id) redirect(`/cerita/${id}`);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href={`/cerita/${id}`} className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-medium text-ink">Tambah Episode</h1>
      </header>
      <p className="text-sm text-ink/55">Cerita: {story.title as string}</p>
      <form action={addEpisodeAction} className="flex flex-col gap-3">
        <input type="hidden" name="story_id" value={id} />
        <input
          name="title"
          maxLength={200}
          placeholder="Judul episode (opsional)"
          className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm text-ink outline-none focus:border-sky-300"
        />
        <textarea
          name="body"
          required
          rows={14}
          placeholder="Tulis episode ini sepanjang yang kamu mau..."
          className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm leading-relaxed text-ink outline-none focus:border-sky-300"
        />
        <button className="rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
          Terbitkan episode
        </button>
      </form>
    </main>
  );
}
