import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateStoryAction } from "@/app/cerita/actions";

export const metadata = { title: "Edit Cerita — Soulpace" };

export default async function EditCeritaPage({
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
    .select("id, title, content_warning, author_id")
    .eq("id", id)
    .maybeSingle();
  if (!story || story.author_id !== user.id) redirect(`/cerita/${id}`);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href={`/cerita/${id}`} className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-medium text-ink">Edit Cerita</h1>
      </header>
      <p className="text-sm text-ink/55">
        Untuk mengubah isi tulisan, edit episodenya. Di sini kamu ubah judul & peringatan.
      </p>
      <form action={updateStoryAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={story.id as string} />
        <input
          name="title"
          required
          maxLength={200}
          defaultValue={story.title as string}
          placeholder="Judul cerita"
          className="rounded-xl border border-ink/10 bg-white/60 p-3 text-base font-semibold text-ink outline-none focus:border-sky-300"
        />
        <input
          name="content_warning"
          maxLength={200}
          defaultValue={(story.content_warning as string | null) ?? ""}
          placeholder="Peringatan isi sensitif (opsional)"
          className="rounded-xl border border-ink/10 bg-white/60 p-2.5 text-xs text-ink outline-none focus:border-sky-300"
        />
        <button className="rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
          Simpan perubahan
        </button>
      </form>
    </main>
  );
}
