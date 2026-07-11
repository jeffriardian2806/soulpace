import Link from "next/link";
import { EventBannerSlot } from "@/components/events/EventBannerSlot";
import { createClient } from "@/lib/supabase/server";
import { getFeatureFlagMap, PremiumBadgeInline } from "@/components/PremiumGate";

export const metadata = { title: "Main & Kenali Diri — Flouwell" };

// Grup game — Augmented Reality paling atas (default kebuka), sisanya collapsed.
type GameEntry = { href: string; slug: string; emoji: string; title: string; desc: string };
const GROUPS: { key: string; emoji: string; title: string; tagline: string; open?: boolean; items: GameEntry[] }[] = [
  {
    key: "augmented-reality", emoji: "✨", title: "Augmented Reality", tagline: "Kamera + dunia nyata. Fitur paling baru & seru.", open: true,
    items: [
      { href: "/main/scan", slug: "scan-diri", emoji: "🔮", title: "Scan Diri", desc: "Kamera baca aura, persona, karakter, love meter, umur emosi, batin, sampai detektor bohong — 8 mode. Hiburan." },
      { href: "/ramalan", slug: "ramalan", emoji: "🌙", title: "Ramalan Harianmu", desc: "Ramalan pagi yang dibaca dari jejak datamu sendiri — bukan horoskop random." },
    ],
  },
  {
    key: "relaksasi", emoji: "🧘", title: "Relaksasi & Tenang", tagline: "Buat nurunin tegang, pelan-pelan.",
    items: [
      { href: "/main/napas", slug: "napas", emoji: "🫧", title: "Tarik Napas", desc: "Latihan napas 4-7-8. Ikutin lingkaran biar tenang." },
      { href: "/main/grounding", slug: "grounding", emoji: "🧭", title: "Grounding 5-4-3-2-1", desc: "Cemas? Balik ke sekarang lewat indra." },
      { href: "/main/lepas", slug: "lepas", emoji: "💨", title: "Lepasin Pikiran", desc: "Tulis, tap balon, pecahin. Lepasin pelan-pelan." },
      { href: "/scream", slug: "scream", emoji: "📢", title: "Lampias Suara", desc: "Teriak, hum, helaan napas keras. Real-time, zero recording." },
      { href: "/ambient", slug: "ambient-media", emoji: "🎵", title: "Suara Tenang", desc: "Audio & video ambient: sungai, hujan, api unggun, ombak." },
    ],
  },
  {
    key: "kenali-diri", emoji: "🪞", title: "Kenali Diri", tagline: "Refleksi ringan, tanpa dihakimi.",
    items: [
      { href: "/main/cermin", slug: "mirror", emoji: "🪞", title: "Pikiran Mirror", desc: "10 situasi hidup, dapet profil cara kamu menghadapi." },
      { href: "/main/tarot", slug: "tarot", emoji: "🎴", title: "Tarot Refleksi", desc: "Tarik 3 kartu: situasi, perasaan, aksi. Cermin diri." },
      { href: "/main/warna", slug: "warna", emoji: "🎨", title: "Warna Hari Ini", desc: "Pilih warna yang match vibe kamu. Tanpa kata." },
      { href: "/main/pilih-vibe", slug: "pilih-vibe", emoji: "🌈", title: "Pilih Vibe", desc: "Forced choice grafis: pilih A atau B → vibe profile hari ini." },
      { href: "/main/mata-pertama", slug: "mata-pertama", emoji: "👁️", title: "Mata Pertama", desc: "Apa yang lo lihat pertama → vibe insight playful." },
      { href: "/main/baterai", slug: "baterai", emoji: "🔋", title: "Energi Sosial", desc: "Simulasi 7 hari: jaga balance sosial, energi, produktivitas." },
      { href: "/main/suara", slug: "suara", emoji: "🗣️", title: "Suara Dalam Kepala", desc: "Suara kritis vs supportive. Pilih mana yang didenger." },
    ],
  },
  {
    key: "latihan", emoji: "🎯", title: "Latihan & Seru-seruan", tagline: "Asah EQ & pikiran sambil main.",
    items: [
      { href: "/main/monster", slug: "monster", emoji: "👹", title: "Monster Cemas", desc: "Pilih respons ke pikiran negatif — liat monster mengecil." },
      { href: "/main/detektif", slug: "detektif", emoji: "🔍", title: "Detektif Emosi", desc: "Tebak emosi di balik chat. Latihan EQ ringan." },
      { href: "/main/emosi", slug: "emosi", emoji: "🎯", title: "Tebak Emosi", desc: "Rapid-fire: lihat kartu, tebak emosi. Seru & cepet." },
      { href: "/main/tantang", slug: "tantang", emoji: "🌀", title: "Tantang Pikiran", desc: "Latihan CBT: pisahkan distorsi dari pikiran sehat." },
      { href: "/main/trail", slug: "trail", emoji: "🛤️", title: "Trail Making Test", desc: "Connect dots berurutan. Ngukur cognitive flexibility." },
    ],
  },
  {
    key: "saat-berat", emoji: "🛟", title: "Saat Lagi Berat", tagline: "Pegangan pas kondisi lagi susah.",
    items: [
      { href: "/anchor-album", slug: "anchor-album", emoji: "📸", title: "Anchor Album", desc: "Foto pribadi visual anchor pas crisis. Private & encrypted." },
      { href: "/crisis-mode", slug: "crisis-mode", emoji: "🛟", title: "SAYA DI SINI", desc: "Crisis Companion: somatic anchor → konek manusia → temenin 10 menit." },
    ],
  },
];

const REFLECTIVE = [
  { href: "/main/pilihan", slug: "pilihan", emoji: "🌙", title: "Ini atau Itu", desc: "Check-in cepat: kamu lagi butuh apa malam ini." },
  { href: "/main/empati", slug: "empati", emoji: "💙", title: "Pilih Respons Terbaik", desc: "Latihan jadi pendengar yang menenangkan." },
  { href: "/main/quest", slug: "quest", emoji: "🗺️", title: "7 Hari Kenal Diri", desc: "Program refleksi pendek, tanpa hukuman." },
  { href: "/main/poll", slug: "poll", emoji: "📊", title: "Polling Hari Ini", desc: "Suara anonim — biar tahu kamu nggak sendiri." },
  { href: "/main/ruang", slug: "ruang", emoji: "🪟", title: "Ruang Hari Ini", desc: "Satu kalimat bareng-bareng." },
];

export default async function MainPage() {
  const supabase = await createClient();

  const [{ data: quizzes }, { data: challenges }, { data: vibes }, flagMap] = await Promise.all([
    supabase.from("quizzes").select("slug, title, emoji, intro").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("daily_challenges").select("body").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("vibe_presets").select("emoji, label, href").eq("is_active", true).order("sort_order", { ascending: true }),
    getFeatureFlagMap(),
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

      <EventBannerSlot />

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

      {GROUPS.map((g) => (
        <details key={g.key} open={g.open} className="glass rounded-2xl p-1 open:pb-3">
          <summary className="cursor-pointer list-none rounded-xl p-3 transition-colors hover:bg-sky-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-ink">{g.emoji} {g.title} <span className="ml-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">{g.items.length}</span></p>
                <p className="mt-0.5 text-xs text-ink/55">{g.tagline}</p>
              </div>
              <span className="text-ink/40 transition-transform [details[open]_&]:rotate-180">▾</span>
            </div>
          </summary>
          <div className="grid grid-cols-1 gap-3 px-3 pt-1 sm:grid-cols-2">
            {g.items.map((e) => (
              <Link key={e.href} href={e.href} className="rounded-2xl bg-white/70 p-4 ring-1 ring-ink/5 transition-colors hover:bg-sky-50">
                <div className="flex items-start justify-between">
                  <p className="text-2xl">{e.emoji}</p>
                  <PremiumBadgeInline flagMap={flagMap} slug={e.slug} />
                </div>
                <p className="mt-1 text-sm font-bold text-ink">{e.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{e.desc}</p>
              </Link>
            ))}
          </div>
        </details>
      ))}

      <section>
        <p className="mb-2 text-sm font-bold text-ink">📝 Kuis & Refleksi</p>
        <p className="mb-3 text-xs text-ink/55">Eksplorasi diri lewat pertanyaan singkat.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(quizzes ?? []).map((q: { slug: string; title: string; emoji: string; intro: string }) => (
            <Link key={q.slug} href={`/main/${q.slug}`} className="glass rounded-2xl p-4 transition-colors hover:bg-sky-50">
              <div className="flex items-start justify-between">
                <p className="text-2xl">{q.emoji}</p>
                <PremiumBadgeInline flagMap={flagMap} slug={q.slug} />
              </div>
              <p className="mt-1 text-sm font-bold text-ink">{q.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{q.intro}</p>
            </Link>
          ))}
          {REFLECTIVE.map((e) => (
            <Link key={e.href} href={e.href} className="glass rounded-2xl p-4 transition-colors hover:bg-sky-50">
              <div className="flex items-start justify-between">
                <p className="text-2xl">{e.emoji}</p>
                <PremiumBadgeInline flagMap={flagMap} slug={e.slug} />
              </div>
              <p className="mt-1 text-sm font-bold text-ink">{e.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{e.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
