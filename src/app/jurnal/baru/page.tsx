import Link from "next/link";
import { createJournalAction } from "@/app/jurnal/actions";

export const metadata = { title: "Tulis Jurnal — Flouwell" };

export default function JurnalBaruPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/jurnal" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <h1 className="text-xl font-medium text-ink">Tulis Jurnal</h1>
      </header>
      <form action={createJournalAction} className="flex flex-col gap-3">
        <input
          name="title"
          placeholder="Judul (opsional)"
          maxLength={200}
          className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm text-ink outline-none focus:border-sky-300"
        />
        <textarea
          name="body"
          required
          rows={14}
          placeholder="Tulis sepanjang yang kamu mau. Ceritakan apa pun..."
          className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm leading-relaxed text-ink outline-none focus:border-sky-300"
        />
        <button className="rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
          Simpan jurnal
        </button>
      </form>
    </main>
  );
}
