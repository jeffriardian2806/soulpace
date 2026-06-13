import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Main & Kenali Diri — Soulpace" };

// Permainan interaktif — visual & tactile, taruh di atas biar narik mata user
const INTERACTIVE = [
  { href: "/main/cermin", emoji: "🪞", title: "Pikiran Mirror", desc: "10 situasi hidup, dapet profil cara kamu menghadapi." },
  { href: "/main/tarot", emoji: "🎴", title: "Tarot Refleksi", desc: "Tarik 3 kartu: situasi, perasaan, aksi. Cermin diri." },
  { href: "/main/napas", emoji: "🫧", title: "Tarik Napas", desc: "Latihan napas 4-7-8. Ikutin lingkaran biar tenang." },
  { href: "/main/baterai", emoji: "🔋", title: "Energi Sosial", desc: "Simulasi 7 hari: jaga balance sosial, energi, produktivitas." },
  { href: "/main/monster", emoji: "👹", title: "Monster Cemas", desc: "Pilih respons ke pikiran negatif — liat monster mengecil." },
  { href: "/main/detektif", emoji: "🔍", title: "Detektif Emosi", desc: "Tebak emosi di balik chat. Latihan EQ ringan." },
  { href: "/main/suara", emoji: "🗣️", title: "Suara Dalam Kepala", desc: "Suara kritis vs supportive. Pilih mana yang didenger." },
  { href: "/main/emosi", emoji: "🎯", title: "Tebak Emosi", desc: "Rapid-fire: lihat kartu, tebak emosi. Seru & cepet." },
  { href: "/main/lepas", emoji: "💨", title: "Lepasin Pikiran", desc: "Tulis, tap balon, pecahin. Lepasin pelan-pelan." },
  { href: "/main/warna", emoji: "🎨", title: "Warna Hari Ini", desc: "Pilih warna yang match vibe kamu. Tanpa kata." },
  { href: "/main/tantang", emoji: "🌀", title: "Tantang Pikiran", desc: "Latihan CBT: pisahkan distorsi dari pikiran sehat." },
  { href: "/main/grounding", emoji: "🧭", title: "Grounding 5-4-3-2-1", desc: "Cemas? Balik ke sekarang lewat indra." },
];

// Reflektif — text-based, butuh mikir & baca. Taruh setelah interaktif.
const REFLECTIVE = [
  { href: "/main/pilihan", emoji: "🌙", title: "Ini atau Itu", desc: "Check-in cepat: kamu lagi butuh apa malam ini." },
  { href: "/main/empati", emoji: "💙", title: "Pilih Respons Terbaik", desc: "Latihan jadi pendengar yang menenangkan." },
  { href: "/main/quest", emoji: "🗺️", title: "7 Hari Kenal Diri", desc: "Program refleksi pendek, tanpa hukuman." },
  { href: "/main/poll", emoji: "📊", title: "Polling Hari Ini", desc: "Suara anonim — biar tahu kamu nggak sendiri." },
  { href: "/main/ruang", emoji: "🪟", title: "Ruang Hari Ini", desc: "Satu kalimat bareng-bareng." },
];

export default async function MainPage() {
  const supabase = await createClient();

  const [{ data: quizzes }, { data: challenges }, { data: vibes }] = await Promise.all([
    supabase.from("quizzes").select("slug, title, emoji, intro").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("daily_challenges").select("body").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("vibe_presets").select("emoji, label, href").eq("is_active", true).order("sort_order", { ascending: true }),
  ]);

  const challengeList = (challenges ?? []).map((r: { body: string }) => r.body);
  const todaysChallenge = challengeList.length
    ? challengeList[Math.floor(Date.now() / 86400000) % challengeList.length]
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">Main &amp; Kenali Diri</h1>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Tempat buat ngenalin diri pelan-pelan. Semua di sini refleksi, bukan diagnosis.
      </p>

      {todaysChallenge && (
        <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-white/70">Tantangan empati hari ini</p>
          <p className="mt-1 text-sm font-medium leading-relaxed">{todaysChallenge}</p>
          <p className="mt-2 text-xs text-white/70">Lembut aja — kerjain kalau kamu lagi sanggup.</p>
        </div>
      )}

      {(vibes?.length ?? 0) > 0 && (
        <section className="glass rounded-2xl p-4">
          <p className="mb-2 text-sm font-bold text-ink">Lagi pengen apa?</p>
          <div className="flex flex-wrap gap-2">
            {(vibes ?? []).map((v: { emoji: string; label: string; href: string }, i: number) => (
              <Link key={i} href={v.href} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-sky-50">
                {v.emoji} {v.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="mb-2 text-sm font-bold text-ink">✨ Permainan Interaktif</p>
        <p className="mb-3 text-xs text-ink/55">Tactile & visual — cocok pas otak udah cape.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {INTERACTIVE.map((e) => (
            <Link key={e.href} href={e.href} className="glass rounded-2xl p-4 transition-colors hover:bg-sky-50">
              <p className="text-2xl">{e.emoji}</p>
              <p className="mt-1 text-sm font-bold text-ink">{e.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{e.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-bold text-ink">📝 Kuis & Refleksi</p>
        <p className="mb-3 text-xs text-ink/55">Eksplorasi diri lewat pertanyaan singkat.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(quizzes ?? []).map((q: { slug: string; title: string; emoji: string; intro: string }) => (
            <Link key={q.slug} href={`/main/${q.slug}`} className="glass rounded-2xl p-4 transition-colors hover:bg-sky-50">
              <p className="text-2xl">{q.emoji}</p>
              <p className="mt-1 text-sm font-bold text-ink">{q.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{q.intro}</p>
            </Link>
          ))}
          {REFLECTIVE.map((e) => (
            <Link key={e.href} href={e.href} className="glass rounded-2xl p-4 transition-colors hover:bg-sky-50">
              <p className="text-2xl">{e.emoji}</p>
              <p className="mt-1 text-sm font-bold text-ink">{e.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{e.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
