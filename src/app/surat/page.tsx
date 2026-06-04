import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createLetterAction } from "@/app/surat/actions";

export const metadata = { title: "Surat untuk Diri di Masa Depan — Soulpace" };

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function SuratPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("future_letters")
    .select("id, body, deliver_at, created_at")
    .eq("user_id", user.id)
    .order("deliver_at", { ascending: true })
    .limit(100);

  const now = Date.now();
  const letters = data ?? [];
  const arrived = letters.filter((l) => new Date(l.deliver_at as string).getTime() <= now);
  const sealed = letters.filter((l) => new Date(l.deliver_at as string).getTime() > now);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Surat untuk Masa Depan</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">
          Kembali ke beranda
        </Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Tulis surat buat dirimu di masa depan. Surat disegel sampai waktunya tiba, lalu kamu
        bisa baca lagi dan lihat sejauh apa kamu udah melangkah.
      </p>

      {arrived.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink">Surat dari dirimu di masa lalu</h2>
          {arrived.map((l) => (
            <div key={l.id} className="glass rounded-2xl p-4">
              <p className="text-xs text-ink/45">
                Ditulis {fmt(l.created_at as string)} · tiba {fmt(l.deliver_at as string)}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
                {l.body as string}
              </p>
            </div>
          ))}
        </section>
      )}

      <section className="glass rounded-2xl p-4">
        <h2 className="text-sm font-bold text-ink">Tulis surat baru</h2>
        <form action={createLetterAction} className="mt-3 flex flex-col gap-3">
          <textarea
            name="body"
            required
            rows={8}
            placeholder="Untuk diriku nanti..."
            className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm leading-relaxed text-ink outline-none focus:border-sky-300"
          />
          <label className="text-xs text-ink/60">
            Kirim ke diriku dalam:
            <select
              name="months"
              defaultValue={6}
              className="ml-2 rounded-lg border border-ink/10 bg-white/60 p-1.5 text-sm text-ink outline-none focus:border-sky-300"
            >
              <option value={1}>1 bulan</option>
              <option value={3}>3 bulan</option>
              <option value={6}>6 bulan</option>
              <option value={12}>1 tahun</option>
            </select>
          </label>
          <button className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white">
            Segel surat
          </button>
        </form>
      </section>

      {sealed.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-ink">Masih disegel</h2>
          {sealed.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3 text-sm text-ink/65"
            >
              <span>Surat tersegel</span>
              <span className="text-xs text-ink/45">tiba {fmt(l.deliver_at as string)}</span>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
