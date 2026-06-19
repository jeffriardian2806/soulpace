import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";
import { getProfilesService } from "@/modules/profiles";
import { PostCard } from "@/components/PostCard";
import { PremiumStatusCard } from "@/components/PremiumStatusCard";

type GameSummary = { title: string; headline: string; value?: string; secondary?: string; emoji?: string };
type GameResultRow = { game_key: string; summary: GameSummary; created_at: string };
type QuizResultRow = { quiz_key: string; result_key: string; created_at: string };

// game_key → href untuk re-take
// Resolusi href dari game_key:
// - Semua game di-link ke /laporan/{gameKey} (laporan dalam, ada tombol "Ulangi tes" di sana)
function resolveHref(gameKey: string): string {
  return `/laporan/${gameKey}`;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profilesSvc = await getProfilesService();
  const profile = await profilesSvc.getProfile(user.id);

  const postsSvc = await getPostsService();
  const posts = await postsSvc.listByAuthor(user.id);

  // Ambil semua hasil game/skrining user, urutkan terbaru dulu
  // Dedupe by game_key — ambil yang terakhir (created_at paling baru) per game_key
  const { data: gameResultRows } = await supabase
    .from("user_game_results")
    .select("game_key, summary, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const latestByGame = new Map<string, GameResultRow>();
  ((gameResultRows ?? []) as GameResultRow[]).forEach((r) => {
    if (!latestByGame.has(r.game_key)) latestByGame.set(r.game_key, r);
  });

  // === MHCU aggregation: group screening_<mhcu_slug> jadi 1 card aggregate ===
  // Fetch list MHCU instruments biar tau total + status komplet
  const { data: mhcuInstrumentList } = await supabase
    .from("screening_instruments")
    .select("slug")
    .eq("category", "mhcu")
    .eq("is_active", true);
  const mhcuSlugs = new Set(((mhcuInstrumentList ?? []) as { slug: string }[]).map((m) => `screening_${m.slug}`));
  const mhcuTotal = mhcuSlugs.size;

  // Cek MHCU completed dalam 30 hari (untuk konsistensi sama flow gate)
  const cutoffMhcu = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const mhcuDoneInWindow = new Set<string>();
  ((gameResultRows ?? []) as GameResultRow[]).forEach((r) => {
    if (mhcuSlugs.has(r.game_key) && r.created_at >= cutoffMhcu) {
      mhcuDoneInWindow.add(r.game_key);
    }
  });
  const mhcuDoneCount = mhcuDoneInWindow.size;
  const mhcuComplete = mhcuTotal > 0 && mhcuDoneCount === mhcuTotal;
  const mhcuStarted = mhcuDoneCount > 0;

  // Hilangkan MHCU entries dari latestGameResults — diganti aggregate card
  const latestGameResults = Array.from(latestByGame.values()).filter((r) => !mhcuSlugs.has(r.game_key));

  // Ambil hasil quiz lama (pattern existing quiz_results)
  const { data: quizRows } = await supabase
    .from("quiz_results")
    .select("quiz_key, result_key, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const latestByQuiz = new Map<string, QuizResultRow>();
  ((quizRows ?? []) as QuizResultRow[]).forEach((r) => {
    if (!latestByQuiz.has(r.quiz_key)) latestByQuiz.set(r.quiz_key, r);
  });
  const latestQuizResults = Array.from(latestByQuiz.values());

  // Fetch quiz titles for display
  const quizKeys = latestQuizResults.map((q) => q.quiz_key);
  const { data: quizMeta } = quizKeys.length
    ? await supabase.from("quizzes").select("slug, title, emoji").in("slug", quizKeys)
    : { data: [] };
  const quizMetaMap = new Map<string, { title: string; emoji: string }>();
  ((quizMeta ?? []) as { slug: string; title: string; emoji: string }[]).forEach((q) => {
    quizMetaMap.set(q.slug, { title: q.title, emoji: q.emoji });
  });

  const hasAnyResult = latestGameResults.length > 0 || latestQuizResults.length > 0 || mhcuStarted;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <h1 className="text-xl font-bold text-ink">Perjalananku</h1>
      </header>

      <div className="glass rounded-2xl p-4">
        <p className="text-lg font-semibold text-ink">{profile?.handle}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/55">
          Ini ruang pribadimu. Hanya kamu yang bisa melihat halaman ini. Sesekali
          baca lagi, dan lihat sudah sejauh apa kamu bertahan.
        </p>
      </div>

      <PremiumStatusCard />

      {/* === Entry point: Riwayat 30 Hari === */}
      <Link href="/riwayat" className="rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 p-4 ring-1 ring-emerald-100 transition-colors hover:bg-emerald-100/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">Riwayat 30 Hari</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink/55">Timeline mood, jurnal, syukur, tes, & curhat — semua dalam 1 view</p>
          </div>
          <span className="text-xs text-sky-600">→</span>
        </div>
      </Link>

      {/* === Entry point: Pusat Bantuan === */}
      <Link href="/resource" className="rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 p-4 ring-1 ring-rose-100 transition-colors hover:bg-rose-100/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌐</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">Pusat Bantuan</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink/55">Crisis line, psikolog, & artikel edukasi terpercaya</p>
          </div>
          <span className="text-xs text-sky-600">→</span>
        </div>
      </Link>

      {/* === Tes & Pengenalan Diri === */}
      <section className="glass rounded-2xl p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold text-ink">🎯 Tes & Pengenalan Diri</h2>
          {hasAnyResult && (
            <Link href="/main" className="text-xs text-sky-600">Coba lainnya →</Link>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink/55">
          Hasil dari semua tes & skrining yang pernah kamu coba. Diambil dari yang paling terakhir kamu kerjain.
        </p>

        {!hasAnyResult ? (
          <div className="mt-4 rounded-xl bg-sky-50/50 p-4 text-center">
            <p className="text-sm text-ink/60">Belum ada hasil tes.</p>
            <Link href="/main" className="mt-2 inline-block text-sm font-semibold text-sky-600">Mulai coba →</Link>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {/* === MHCU aggregate card (kalau ada activity MHCU) === */}
            {mhcuStarted && (
              <Link
                href={mhcuComplete ? "/laporan/mhcu" : "/skrining"}
                className="flex items-start gap-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3 ring-1 ring-emerald-200 transition-colors hover:from-emerald-100 hover:to-teal-100"
              >
                <span className="text-2xl">🌱</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xs uppercase tracking-wide text-emerald-700/70">Mental Health Check-Up</p>
                    <span className="text-[10px] text-emerald-600">{mhcuComplete ? "Lihat laporan komprehensif →" : "Lanjut MHCU →"}</span>
                  </div>
                  <p className="mt-0.5 text-sm font-bold text-ink">
                    {mhcuComplete ? "MHCU komplet" : `MHCU sedang berjalan (${mhcuDoneCount}/${mhcuTotal})`}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink/60">
                    {mhcuComplete
                      ? "Hasil agregat lintas 6 dimensi siap dilihat."
                      : `Tinggal ${mhcuTotal - mhcuDoneCount} tahap lagi. Hasil cuma muncul setelah semua selesai.`}
                  </p>
                </div>
              </Link>
            )}

            {latestGameResults.map((r) => {
              const s = r.summary;
              return (
                <Link key={r.game_key} href={resolveHref(r.game_key)} className="flex items-start gap-3 rounded-xl border border-sky-100 bg-white/60 p-3 transition-colors hover:bg-sky-50">
                  <span className="text-2xl">{s.emoji ?? "✨"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-xs uppercase tracking-wide text-ink/45">{s.title}</p>
                      <span className="text-[10px] text-ink/40">Lihat laporan →</span>
                    </div>
                    <p className="mt-0.5 text-sm font-bold text-ink">{s.headline}</p>
                    {s.value && <p className="mt-0.5 text-xs leading-relaxed text-ink/60">{s.value}</p>}
                    {s.secondary && <p className="mt-0.5 text-[10px] italic text-ink/45">{s.secondary}</p>}
                  </div>
                </Link>
              );
            })}

            {latestQuizResults.map((q) => {
              const meta = quizMetaMap.get(q.quiz_key);
              return (
                <Link key={q.quiz_key} href={`/main/${q.quiz_key}`} className="flex items-start gap-3 rounded-xl border border-sky-100 bg-white/60 p-3 transition-colors hover:bg-sky-50">
                  <span className="text-2xl">{meta?.emoji ?? "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-xs uppercase tracking-wide text-ink/45">{meta?.title ?? q.quiz_key}</p>
                      <span className="text-[10px] text-ink/40">Lihat laporan →</span>
                    </div>
                    <p className="mt-0.5 text-sm font-bold text-ink capitalize">{q.result_key.replace(/_/g, " ")}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-sm text-ink/55">{posts.length} curhat</p>

      {posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/40">
          Belum ada curhat. Perjalananmu dimulai dari sini.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} peluked={false} />
          ))}
        </div>
      )}
    </main>
  );
}
