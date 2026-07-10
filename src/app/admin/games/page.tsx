import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin Games — Flouwell" };

type CardItem = { href: string; emoji: string; title: string; desc: string };

const GROUPS: { title: string; items: CardItem[] }[] = [
  {
    title: "💙 Konten Universal",
    items: [
      { href: "/admin/games/daily-message",    emoji: "💬", title: "Pesan Hari Ini",     desc: "Quote yang muncul di banner atas feed." },
      { href: "/admin/games/daily-challenges", emoji: "🎯", title: "Tantangan Empati",   desc: "Daily challenge yang muncul di /main." },
      { href: "/admin/games/vibe-presets",     emoji: "🎨", title: "Vibe Presets",       desc: "Shortcut emoji-label di hub /main." },
      { href: "/admin/games/edukasi",          emoji: "📚", title: "Tips & Edukasi",    desc: "Topic per kondisi (overthinking, cemas, dll) + tips actionable." },
      { href: "/admin/games/teks",             emoji: "✏️", title: "Teks Halaman Admin", desc: "Ganti judul & penjelasan halaman admin biar lebih human friendly." },
      { href: "/admin/games/video",            emoji: "🎬", title: "Video Edukasi",     desc: "Video YouTube buat halaman Edukasi (publik) + statistik view." },
      { href: "/admin/games/aura",             emoji: "🔮", title: "Cek Aura AR",       desc: "Mood & aura buat game AR: warna, deskripsi mistis, partikel." },
      { href: "/admin/games/scan-diri",        emoji: "🎭", title: "Scan Diri AR",      desc: "Konten persona, karakter, love meter, umur emosi, masa depan, batin, ramalan." },
      { href: "/admin/games/ambient-media",    emoji: "🎵", title: "Ambient Media",     desc: "Audio/video calming via external link (Pixabay/YouTube/Vimeo)." },
      { href: "/admin/games/crisis-mode",      emoji: "🛟", title: "Crisis Mode Messages", desc: "Text yang muncul + dibacakan di Crisis Companion phase-phase. Edit / tambah gentle messages." },
    ],
  },
  {
    title: "🎓 Tes Psikologi",
    items: [
      { href: "/admin/games/mirror",   emoji: "🪞", title: "Pikiran Mirror",   desc: "Profile + skenario 10 situasi hidup." },
      { href: "/admin/games/spektrum", emoji: "🌗", title: "Spektrum Sosial",  desc: "Kategori + pertanyaan introvert/extrovert (Big Five)." },
      { href: "/admin/games/kompas",   emoji: "🧭", title: "Kompas Jurusan",   desc: "Tipe RIASEC + pertanyaan + jurusan (Holland)." },
    ],
  },
  {
    title: "✨ Permainan Interaktif",
    items: [
      { href: "/admin/games/tarot",     emoji: "🎴", title: "Tarot Refleksi",     desc: "Kartu + arti situasi/perasaan/aksi." },
      { href: "/admin/games/napas",     emoji: "🫧", title: "Tarik Napas",         desc: "Protokol napas (4-7-8, box, dsb)." },
      { href: "/admin/games/warna",     emoji: "🎨", title: "Warna Hari Ini",      desc: "Daftar warna + label + note." },
      { href: "/admin/games/grounding", emoji: "🧭", title: "Grounding 5-4-3-2-1", desc: "5 step indera buat anxiety." },
      { href: "/admin/games/tantang",   emoji: "🌀", title: "Tantang Pikiran",     desc: "Skenario CBT distorsi/netral/sehat." },
      { href: "/admin/games/detektif",  emoji: "🔍", title: "Detektif Emosi",      desc: "Kasus EQ + opsi tebakan." },
      { href: "/admin/games/suara",     emoji: "🗣️", title: "Suara Dalam Kepala",  desc: "Skenario suara kritis vs supportive." },
      { href: "/admin/games/baterai",   emoji: "🔋", title: "Energi Sosial",       desc: "Aktivitas + delta sosial/energi/produktivitas." },
      { href: "/admin/games/emosi",     emoji: "🎯", title: "Tebak Emosi",         desc: "Kartu rapid-fire matching emosi." },
      { href: "/admin/games/monster",   emoji: "👹", title: "Monster Cemas",       desc: "Situasi cemas + respons CBT." },
    ],
  },
  {
    title: "📝 Kuis & Engagement",
    items: [
      { href: "/admin/games/this-or-that", emoji: "🌙", title: "This or That", desc: "Pilihan A/B check-in cepat." },
      { href: "/admin/games/quest",        emoji: "🗺️", title: "7 Hari Kenal Diri", desc: "Prompt per hari (1-7)." },
    ],
  },
  {
    title: "💬 Auto Reply",
    items: [
      { href: "/admin/games/support-messages", emoji: "💙", title: "Pesan Otomatis (Support)", desc: "Template pesan ke user crisis/severe." },
    ],
  },
];

export default async function AdminGamesLanding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/settings" className="text-sm font-medium text-sky-600 hover:underline">
          ← Pengaturan
        </Link>
        <Link href="/admin/monetization" className="text-xs font-medium text-purple-600 hover:underline">
          💎 Monetisasi
        </Link>
      </header>
      <h1 className="text-xl font-bold text-ink">🎮 Admin Games</h1>
      <p className="text-sm leading-relaxed text-ink/60">
        Kelola konten setiap fitur. Klik kategori buat masuk editor masing-masing.
      </p>

      {GROUPS.map((g) => (
        <section key={g.title} className="flex flex-col gap-2">
          <h2 className="text-base font-bold text-ink">{g.title}</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {g.items.map((it) => (
              <Link key={it.href} href={it.href} className="glass rounded-2xl p-3 transition-colors hover:bg-sky-50">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{it.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink">{it.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{it.desc}</p>
                  </div>
                  <span className="text-xs text-sky-600">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
