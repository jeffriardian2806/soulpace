import Link from "next/link";
import { QUIZZES } from "@/core/quizzes";
import { challengeOfTheDay } from "@/core/lightContent";

export const metadata = { title: "Main & Kenali Diri — Soulpace" };

const EXTRA = [
  { href: "/main/empati", emoji: "💙", title: "Pilih Respons Terbaik", desc: "Latihan jadi pendengar yang menenangkan." },
  { href: "/main/pilihan", emoji: "🌙", title: "Ini atau Itu", desc: "Check-in cepat: kamu lagi butuh apa malam ini." },
  { href: "/main/quest", emoji: "🗺️", title: "7 Hari Kenal Diri", desc: "Program refleksi pendek, tanpa hukuman." },
  { href: "/main/poll", emoji: "📊", title: "Polling Hari Ini", desc: "Suara anonim — biar tahu kamu nggak sendiri." },
  { href: "/main/ruang", emoji: "🪟", title: "Ruang Hari Ini", desc: "Satu kalimat bareng-bareng." },
];

export default function MainPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">Main & Kenali Diri</h1>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Tempat buat ngenalin diri pelan-pelan. Semua di sini refleksi, bukan diagnosis.
      </p>

      <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-white/70">Tantangan empati hari ini</p>
        <p className="mt-1 text-sm font-medium leading-relaxed">{challengeOfTheDay()}</p>
        <p className="mt-2 text-xs text-white/70">Lembut aja — kerjain kalau kamu lagi sanggup.</p>
      </div>

      <section className="glass rounded-2xl p-4">
        <p className="mb-2 text-sm font-bold text-ink">Lagi pengen apa?</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/feed?status=unanswered" className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-sky-50">🤝 Mau bantu yang belum didengar</Link>
          <Link href="/feed?status=didengar" className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-sky-50">👂 Nemenin yang butuh didengar</Link>
          <Link href="/cerita" className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-sky-50">📖 Baca cerita perjuangan</Link>
          <Link href="/hening" className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-sky-50">🌙 Mau yang menenangkan</Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QUIZZES.map((q) => (
          <Link key={q.key} href={`/main/${q.key}`} className="glass rounded-2xl p-4 transition-colors hover:bg-sky-50">
            <p className="text-2xl">{q.emoji}</p>
            <p className="mt-1 text-sm font-bold text-ink">{q.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{q.intro}</p>
          </Link>
        ))}
        {EXTRA.map((e) => (
          <Link key={e.href} href={e.href} className="glass rounded-2xl p-4 transition-colors hover:bg-sky-50">
            <p className="text-2xl">{e.emoji}</p>
            <p className="mt-1 text-sm font-bold text-ink">{e.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{e.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
