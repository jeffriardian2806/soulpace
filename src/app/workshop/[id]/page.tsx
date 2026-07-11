import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWorkshopById } from "@/lib/workshops/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const w = await getWorkshopById(id);
  return { title: w ? `${w.title} — Flouwell` : "Event — Flouwell" };
}

export default async function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const w = await getWorkshopById(id);
  // getWorkshopById lewat RLS publik: kalau event udah lewat unposted / belum posted → null
  if (!w) notFound();

  const eventDate = w.event_date ? new Date(w.event_date).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Tanggal segera diumumkan";
  const past = w.event_date ? new Date(w.event_date).getTime() < Date.now() : false;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🎓 Event</h1>
      </header>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-5 text-white shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/85">Workshop / Training</p>
        <h2 className="mt-1 text-2xl font-bold leading-tight">{w.title}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium">
          <span>📅 {eventDate}</span>
          <span>💰 {w.price_text}</span>
        </div>
      </div>

      {w.description && (
        <section className="glass rounded-2xl p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/50">Deskripsi</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{w.description}</p>
        </section>
      )}

      {!past && w.form_url && (
        <a href={w.form_url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl bg-orange-500 p-4 text-center text-white shadow-md hover:bg-orange-600">
          <p className="text-base font-bold">📝 Daftar Sekarang</p>
          <p className="mt-0.5 text-xs text-white/85">Buka form pendaftaran</p>
        </a>
      )}

      {w.materi_url && (
        <a href={w.materi_url} target="_blank" rel="noopener noreferrer" className="glass block rounded-2xl p-4 ring-1 ring-emerald-200 hover:bg-emerald-50">
          <p className="text-sm font-bold text-emerald-800">📁 Materi & Rekaman</p>
          <p className="mt-0.5 text-xs text-ink/60">Buka arsip materi/rekaman event ini</p>
        </a>
      )}

      {past && !w.materi_url && (
        <p className="rounded-xl bg-ink/5 p-3 text-center text-xs text-ink/55">Event ini sudah selesai. Materi/rekaman akan diunggah sebentar lagi.</p>
      )}
    </main>
  );
}
