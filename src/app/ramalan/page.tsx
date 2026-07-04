import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Ramalan Harianmu — Flouwell" };

// seeded pick stabil per user+tanggal (ramalan sama sepanjang hari)
function seedPick(seedStr: string, n: number): number {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) | 0;
  return Math.abs(h) % Math.max(1, n);
}

export default async function RamalanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const [snapsRes, tmplRes] = await Promise.all([
    supabase.from("aura_snapshots").select("mood_key, aura_label, energy, captured_at").eq("user_id", user.id).gte("captured_at", since).order("captured_at", { ascending: false }).limit(30),
    supabase.from("scan_contents").select("content_key, emoji, title, body").eq("mode", "ramalan").eq("is_active", true),
  ]);
  const snaps = snapsRes.data ?? [];
  const tmpls = (tmplRes.data ?? []);
  const templates = tmpls.filter((t) => t.content_key.startsWith("t"));
  const sarans = tmpls.filter((t) => t.content_key.startsWith("saran_"));

  const todayStr = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dateSeed = new Date().toISOString().slice(0, 10) + user.id;

  let content: { emoji: string; title: string; body: string } | null = null;

  if (snaps.length === 0) {
    content = null; // belum ada data → ajak scan dulu
  } else {
    // aura dominan
    const counts: Record<string, { label: string; n: number }> = {};
    let totalEnergy = 0;
    for (const s of snaps) {
      counts[s.mood_key] = { label: s.aura_label, n: (counts[s.mood_key]?.n ?? 0) + 1 };
      totalEnergy += s.energy ?? 50;
    }
    const dominant = Object.values(counts).sort((a, b) => b.n - a.n)[0];
    const avgEnergy = Math.round(totalEnergy / snaps.length);

    const arah = avgEnergy >= 65 ? "ke arah terang — energimu di atas rata-rata" : avgEnergy <= 40 ? "melambat — tubuhmu minta jeda" : "stabil — cukup untuk hari yang seimbang";
    const saranKey = avgEnergy >= 65 ? "saran_semangat" : avgEnergy <= 40 ? "saran_lelah" : snaps.length >= 5 ? "saran_tenang" : "saran_netral";
    const saran = sarans.find((s) => s.content_key === saranKey)?.body ?? "";

    const tmpl = templates[seedPick(dateSeed, templates.length)] ?? templates[0];
    if (tmpl) {
      content = {
        emoji: tmpl.emoji ?? "🔮",
        title: tmpl.title,
        body: tmpl.body
          .replace("{aura}", dominant.label)
          .replace("{arah}", arah)
          .replace("{saran}", saran)
          .replace("{n}", String(snaps.length)),
      };
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🔮 Ramalan Harianmu</h1>
      </header>
      <p className="text-xs text-ink/50">{todayStr}</p>

      <div className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
        ✨ Ramalan ini hiburan — tapi beda dari horoskop: dia dibaca dari <b>jejak datamu sendiri</b> di Flouwell, bukan bintang random.
      </div>

      {content ? (
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-sky-50 p-6 text-center ring-1 ring-purple-200">
          <p className="text-4xl">{content.emoji}</p>
          <p className="mt-2 text-lg font-bold text-purple-800">{content.title}</p>
          <p className="mt-3 text-sm italic leading-relaxed text-ink/75">&ldquo;{content.body}&rdquo;</p>
          <p className="mt-4 text-[11px] text-ink/45">Flouwell · Ramalan Harian · dibaca dari riwayat aura kamu</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-ink/10">
          <p className="text-4xl">🌫️</p>
          <p className="mt-2 text-base font-bold text-ink">Belum ada yang bisa dibaca</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/60">
            Ramalanmu dibaca dari jejak aura kamu. Scan dulu minimal sekali, besoknya ramalanmu muncul di sini.
          </p>
          <Link href="/main/scan" className="mt-4 inline-block rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white">
            🔮 Scan Aura Sekarang
          </Link>
        </div>
      )}

      <Link href="/main/scan" className="glass flex items-center justify-between rounded-2xl p-4 transition-colors hover:bg-sky-100">
        <span className="text-sm font-medium text-ink">Scan Diri AR<span className="block text-xs font-normal text-ink/55">Tambah jejak biar ramalanmu makin akurat</span></span>
        <span className="text-sky-600">→</span>
      </Link>
    </main>
  );
}
