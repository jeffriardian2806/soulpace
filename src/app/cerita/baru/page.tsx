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
        Tulis langsung apa yang ada di kepalamu. Nanti kalau mau dilanjutin, kamu bisa tambah
        episode lagi kapan saja.
      </p>
      <form action={createStoryAction} className="flex flex-col gap-3">
        <input
          name="title"
          required
          maxLength={200}
          placeholder="Judul cerita"
          className="rounded-xl border border-ink/10 bg-white/60 p-3 text-base font-semibold text-ink outline-none focus:border-sky-300"
        />
        <textarea
          name="body"
          required
          rows={16}
          placeholder="Tulis ceritamu di sini... sepanjang yang kamu mau."
          className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm leading-relaxed text-ink outline-none focus:border-sky-300"
        />
        <input
          name="content_warning"
          maxLength={200}
          placeholder="Peringatan isi sensitif (opsional), mis. 'kekerasan, self-harm'"
          className="rounded-xl border border-ink/10 bg-white/60 p-2.5 text-xs text-ink outline-none focus:border-sky-300"
        />
        <button className="rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
          Terbitkan
        </button>
      </form>
    </main>
  );
}
