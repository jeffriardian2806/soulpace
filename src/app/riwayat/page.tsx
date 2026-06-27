import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Riwayat Psikologi 30 Hari — Flouwell",
  robots: { index: false, follow: false },
};

// Mood value (1-5) → emoji
const MOOD_EMOJI = ["", "😢", "😟", "😐", "🙂", "😊"];
const MOOD_LABEL = ["", "Buruk banget", "Buruk", "Biasa aja", "Lumayan", "Bagus"];

type Kind = "mood" | "gratitude" | "journal" | "letter" | "post" | "game";

type MoodRow = { id: string; mood: number; note: string | null; entry_date: string; created_at: string };
type GratRow = { id: string; items: string[]; created_at: string };
type JournalRow = { id: string; title: string | null; body: string; created_at: string };
type LetterRow = { id: string; body: string; deliver_at: string; created_at: string };
type PostRow = { id: string; body: string; category_id: number; crisis_flag: boolean; created_at: string };
type GameRow = { id: string; game_key: string; summary: { title?: string; headline?: string; value?: string; emoji?: string } | null; created_at: string };

type Item =
  | { kind: "mood"; id: string; created_at: string; data: MoodRow }
  | { kind: "gratitude"; id: string; created_at: string; data: GratRow }
  | { kind: "journal"; id: string; created_at: string; data: JournalRow }
  | { kind: "letter"; id: string; created_at: string; data: LetterRow }
  | { kind: "post"; id: string; created_at: string; data: PostRow }
  | { kind: "game"; id: string; created_at: string; data: GameRow };

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n).trim() + "…" : s; }

function dayLabel(dateISO: string): string {
  const d = new Date(dateISO);
  const today = new Date(); today.setHours(0,0,0,0);
  const itemDay = new Date(d); itemDay.setHours(0,0,0,0);
  const diff = Math.floor((today.getTime() - itemDay.getTime()) / (24*3600*1000));
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function timeLabel(dateISO: string): string {
  return new Date(dateISO).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default async function RiwayatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/riwayat");

  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  // Fetch parallel — 30 hari terakhir
  const [mood, grat, journal, letter, post, game, mhcuInst] = await Promise.all([
    supabase.from("mood_entries").select("id, mood, note, entry_date, created_at").eq("user_id", user.id).gte("created_at", cutoff).order("created_at", { ascending: false }),
    supabase.from("gratitude_entries").select("id, items, created_at").eq("user_id", user.id).gte("created_at", cutoff).order("created_at", { ascending: false }),
    supabase.from("journal_entries").select("id, title, body, created_at").eq("user_id", user.id).gte("created_at", cutoff).order("created_at", { ascending: false }),
    supabase.from("future_letters").select("id, body, deliver_at, created_at").eq("user_id", user.id).gte("created_at", cutoff).order("created_at", { ascending: false }),
    supabase.from("posts").select("id, body, category_id, crisis_flag, created_at").eq("author_id", user.id).eq("status", "active").gte("created_at", cutoff).order("created_at", { ascending: false }),
    supabase.from("user_game_results").select("id, game_key, summary, created_at").eq("user_id", user.id).gte("created_at", cutoff).order("created_at", { ascending: false }),
    supabase.from("screening_instruments").select("slug").eq("category", "mhcu").eq("is_active", true),
  ]);

  // === MHCU filter: jangan tampilin entri MHCU individual di timeline ===
  // (sesuai prinsip: hasil per-step ga boleh dilihat sebelum 6/6 selesai)
  const mhcuKeys = new Set(((mhcuInst.data ?? []) as { slug: string }[]).map((m) => `screening_${m.slug}`));
  const filteredGameRows = ((game.data ?? []) as GameRow[]).filter((r) => !mhcuKeys.has(r.game_key));
  const mhcuRows = ((game.data ?? []) as GameRow[]).filter((r) => mhcuKeys.has(r.game_key));
  const mhcuTotal = mhcuKeys.size;
  const mhcuDoneInWindow = new Set(mhcuRows.map((r) => r.game_key));
  const mhcuDoneCount = mhcuDoneInWindow.size;
  const mhcuComplete = mhcuTotal > 0 && mhcuDoneCount === mhcuTotal;

  // Merge all into single timeline (MHCU individual entries EXCLUDED)
  const items: Item[] = [
    ...((mood.data ?? []) as MoodRow[]).map((d) => ({ kind: "mood" as const, id: d.id, created_at: d.created_at, data: d })),
    ...((grat.data ?? []) as GratRow[]).map((d) => ({ kind: "gratitude" as const, id: d.id, created_at: d.created_at, data: d })),
    ...((journal.data ?? []) as JournalRow[]).map((d) => ({ kind: "journal" as const, id: d.id, created_at: d.created_at, data: d })),
    ...((letter.data ?? []) as LetterRow[]).map((d) => ({ kind: "letter" as const, id: d.id, created_at: d.created_at, data: d })),
    ...((post.data ?? []) as PostRow[]).map((d) => ({ kind: "post" as const, id: d.id, created_at: d.created_at, data: d })),
    ...filteredGameRows.map((d) => ({ kind: "game" as const, id: d.id, created_at: d.created_at, data: d })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Group by date (yyyy-mm-dd)
  const groups = new Map<string, Item[]>();
  items.forEach((it) => {
    const key = new Date(it.created_at).toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  });
  const orderedDays = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));

  // Summary stats
  const counts: Record<Kind, number> = { mood: 0, gratitude: 0, journal: 0, letter: 0, post: 0, game: 0 };
  items.forEach((it) => { counts[it.kind]++; });

  // Mood trend mini
  const moodEntries = ((mood.data ?? []) as MoodRow[]).slice().reverse(); // chronological
  const avgMood = moodEntries.length > 0 ? moodEntries.reduce((s, m) => s + m.mood, 0) / moodEntries.length : null;

  // Active days
  const activeDays = orderedDays.length;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/profile" className="text-sm text-ink/50">← Profil</Link>
        <h1 className="text-xl font-bold text-ink">📅 Riwayat 30 Hari</h1>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Pattern aktivitas kamu di Flouwell 30 hari terakhir. Mood, jurnal, syukur, surat, curhat, tes & skrining — semua dalam satu timeline.
      </p>

      {/* === Summary stats === */}
      <section className="rounded-2xl bg-gradient-to-br from-sky-400 via-purple-400 to-rose-400 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-white/70">Ringkasan</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div><p className="text-2xl font-bold">{items.length}</p><p className="text-[10px] text-white/80">Total entri</p></div>
          <div><p className="text-2xl font-bold">{activeDays}</p><p className="text-[10px] text-white/80">Hari aktif</p></div>
          <div><p className="text-2xl font-bold">{avgMood ? avgMood.toFixed(1) : "—"}</p><p className="text-[10px] text-white/80">Rata-rata mood</p></div>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[10px]">
          {counts.mood > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5">🌡️ {counts.mood} mood</span>}
          {counts.gratitude > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5">🙏 {counts.gratitude} syukur</span>}
          {counts.journal > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5">📔 {counts.journal} jurnal</span>}
          {counts.letter > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5">💌 {counts.letter} surat</span>}
          {counts.post > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5">💬 {counts.post} curhat</span>}
          {counts.game > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5">🎯 {counts.game} tes</span>}
        </div>
      </section>

      {/* === MHCU status (kalau user lagi/udah jalanin MHCU dalam 30 hari) === */}
      {mhcuDoneCount > 0 && (
        <Link
          href={mhcuComplete ? "/laporan/mhcu" : "/skrining"}
          className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-200 transition-colors hover:from-emerald-100 hover:to-teal-100"
        >
          <span className="text-3xl">🌱</span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs uppercase tracking-wide text-emerald-700/70">MHCU dalam 30 hari ini</p>
              <span className="text-[10px] text-emerald-600">{mhcuComplete ? "Lihat laporan →" : "Lanjut →"}</span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-ink">
              {mhcuComplete ? "Komplet semua tahap" : `Sedang berjalan (${mhcuDoneCount}/${mhcuTotal})`}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink/60">
              {mhcuComplete
                ? "Hasil komprehensif siap dilihat. Detail per-dimensi bisa di-drill dari sana."
                : `Hasil cuma muncul setelah ${mhcuTotal} tahap selesai. Tinggal ${mhcuTotal - mhcuDoneCount} lagi.`}
            </p>
          </div>
        </Link>
      )}

      {/* === Mood trend sparkline (kalau ada minimum 3 entries) === */}
      {moodEntries.length >= 3 && (
        <section className="glass rounded-2xl p-4">
          <p className="text-sm font-bold text-ink">🌡️ Trend mood</p>
          <p className="mt-0.5 text-xs text-ink/55">{moodEntries.length} cek-in mood, urutan dari yang terlama ke yang terbaru</p>
          <div className="mt-3 flex items-end justify-between gap-0.5 h-16">
            {moodEntries.map((m) => {
              const h = (m.mood / 5) * 100;
              const color = m.mood >= 4 ? "bg-emerald-400" : m.mood === 3 ? "bg-amber-400" : "bg-rose-400";
              return <div key={m.id} className="flex-1 flex flex-col items-center gap-0.5">
                <div className={`w-full rounded-t-sm ${color}`} style={{ height: `${h}%` }} title={`${MOOD_EMOJI[m.mood]} ${MOOD_LABEL[m.mood]} • ${new Date(m.created_at).toLocaleDateString("id-ID")}`} />
              </div>;
            })}
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-ink/40">
            <span>{new Date(moodEntries[0].created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
            <span>{new Date(moodEntries[moodEntries.length-1].created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
          </div>
        </section>
      )}

      {/* === Timeline === */}
      {items.length === 0 ? (
        <div className="rounded-2xl bg-sky-50/50 p-6 text-center">
          <p className="text-3xl">🌱</p>
          <p className="mt-2 text-sm text-ink/65">Belum ada aktivitas 30 hari terakhir. Mulai dari yang kecil — cek-in mood, atau tulis 1 jurnal.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link href="/mood" className="rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white">🌡️ Mood</Link>
            <Link href="/jurnal" className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-sky-600 ring-1 ring-sky-200">📔 Jurnal</Link>
          </div>
        </div>
      ) : (
        <section className="flex flex-col gap-4">
          {orderedDays.map((day) => (
            <div key={day}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">{dayLabel(day)}</p>
              <ul className="flex flex-col gap-2">
                {groups.get(day)!.map((it) => <li key={`${it.kind}-${it.id}`}><TimelineCard item={it} /></li>)}
              </ul>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

function TimelineCard({ item }: { item: Item }) {
  const time = timeLabel(item.created_at);

  if (item.kind === "mood") {
    const m = item.data;
    return (
      <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3 ring-1 ring-sky-50">
        <span className="text-2xl">{MOOD_EMOJI[m.mood] ?? "🌡️"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-1">
            <p className="text-xs font-semibold text-ink">Cek-in mood</p>
            <span className="text-[10px] text-ink/40">{time}</span>
          </div>
          <p className="mt-0.5 text-sm font-bold text-ink">{m.mood}/5 — {MOOD_LABEL[m.mood]}</p>
          {m.note && <p className="mt-1 text-xs leading-relaxed text-ink/65">{truncate(m.note, 200)}</p>}
        </div>
      </div>
    );
  }

  if (item.kind === "gratitude") {
    const g = item.data;
    return (
      <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3 ring-1 ring-sky-50">
        <span className="text-2xl">🙏</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-1">
            <p className="text-xs font-semibold text-ink">Hal yang disyukurin</p>
            <span className="text-[10px] text-ink/40">{time}</span>
          </div>
          <ul className="mt-1 flex flex-col gap-0.5 text-sm leading-relaxed text-ink/75">
            {g.items.slice(0, 3).map((x, i) => <li key={i}>• {truncate(x, 120)}</li>)}
            {g.items.length > 3 && <li className="text-xs italic text-ink/50">+ {g.items.length - 3} lainnya</li>}
          </ul>
        </div>
      </div>
    );
  }

  if (item.kind === "journal") {
    const j = item.data;
    return (
      <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3 ring-1 ring-sky-50">
        <span className="text-2xl">📔</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-1">
            <p className="text-xs font-semibold text-ink">Jurnal</p>
            <span className="text-[10px] text-ink/40">{time}</span>
          </div>
          {j.title && <p className="mt-0.5 text-sm font-bold text-ink">{j.title}</p>}
          <p className="mt-1 text-xs leading-relaxed text-ink/65">{truncate(j.body, 200)}</p>
        </div>
      </div>
    );
  }

  if (item.kind === "letter") {
    const l = item.data;
    const deliverDate = new Date(l.deliver_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    return (
      <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3 ring-1 ring-sky-50">
        <span className="text-2xl">💌</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-1">
            <p className="text-xs font-semibold text-ink">Surat ke diri sendiri</p>
            <span className="text-[10px] text-ink/40">{time}</span>
          </div>
          <p className="mt-0.5 text-[11px] italic text-ink/50">Akan sampai: {deliverDate}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/65">{truncate(l.body, 180)}</p>
        </div>
      </div>
    );
  }

  if (item.kind === "post") {
    const p = item.data;
    return (
      <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3 ring-1 ring-sky-50">
        <span className="text-2xl">💬</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-1">
            <p className="text-xs font-semibold text-ink">Curhat</p>
            <span className="text-[10px] text-ink/40">{time}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink/75">{truncate(p.body, 220)}</p>
          {p.crisis_flag && <p className="mt-1 text-[10px] text-rose-600">⚠️ Crisis flag — moderator ke-notified saat itu</p>}
        </div>
      </div>
    );
  }

  // game
  const g = item.data;
  const sum = g.summary ?? {};
  return (
    <Link href={`/laporan/${g.game_key}`} className="flex items-start gap-3 rounded-xl bg-white/60 p-3 ring-1 ring-sky-50 transition-colors hover:bg-sky-50">
      <span className="text-2xl">{sum.emoji ?? "🎯"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/65">{sum.title ?? g.game_key}</p>
          <span className="text-[10px] text-ink/40">{time}</span>
        </div>
        <p className="mt-0.5 text-sm font-bold text-ink">{sum.headline}</p>
        {sum.value && <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{sum.value}</p>}
        <span className="mt-1 inline-block text-[10px] text-sky-600">Lihat laporan →</span>
      </div>
    </Link>
  );
}
