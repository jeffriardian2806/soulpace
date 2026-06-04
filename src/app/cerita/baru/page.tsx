import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createStoryAction } from "@/app/cerita/actions";

export const metadata = { title: "Tulis Cerita — Soulpace" };

export default async function CeritaBaruPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/cerita" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-medium text-ink">Tulis Cerita</h1>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Buat dulu judul & ringkasannya. Habis ini kamu bisa nambah episode satu per satu.
      </p>
      <form action={createStoryAction} className="flex flex-col gap-3">
        <input
          name="title"
          required
          maxLength={200}
          placeholder="Judul cerita"
          className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm text-ink outline-none focus:border-sky-300"
        />
        <textarea
          name="summary"
          rows={3}
          maxLength={500}
          placeholder="Ringkasan singkat (opsional)"
          className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm leading-relaxed text-ink outline-none focus:border-sky-300"
        />
        <input
          name="content_warning"
          maxLength={200}
          placeholder="Peringatan isi sensitif, mis. 'kekerasan, self-harm' (opsional)"
          className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm text-ink outline-none focus:border-sky-300"
        />
        <button className="rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
          Buat cerita
        </button>
      </form>
    </main>
  );
}
