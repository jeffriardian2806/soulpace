import { LaporanShell, LaporanSection, LaporanActions, HeroCard } from "./LaporanShell";

type Band = { min_score: number; max_score: number; label: string };

type Dim = {
  slug: string;
  name: string;
  completed: boolean;
  headline: string;
  score: number;
  max: number;
  severity: string;
  band_label: string;
  created_at: string;
  bands: Band[];
};

// Dimensi where lower raw score = better condition (clinical direction inverted)
const INVERT_SLUGS = new Set(["burnout", "digital"]);

/**
 * Compute normalized "goodness" score (0 = worst condition, 1 = best condition)
 * Pakai band tier index — band index user kena dibagi total bands, lalu invert kalau perlu.
 * Lebih akurat dari raw score/max karena align sama band semantic.
 */
function computeNorm(dim: Dim): number {
  if (!dim.bands || dim.bands.length === 0) {
    // Fallback: percentage
    if (!dim.max) return 0.5;
    const raw = dim.score / dim.max;
    return INVERT_SLUGS.has(dim.slug) ? 1 - raw : raw;
  }
  // Cari index band user (match by label first, fallback by score range)
  let idx = dim.bands.findIndex((b) => b.label === dim.band_label);
  if (idx === -1) {
    idx = dim.bands.findIndex((b) => dim.score >= b.min_score && dim.score <= b.max_score);
  }
  if (idx === -1) idx = 0;
  const total = dim.bands.length;
  if (total === 1) return 1;
  // Band index 0 = lowest score band, N-1 = highest score band.
  // For non-invert: high band index = better → norm = idx/(N-1)
  // For invert: high band index = worse → norm = 1 - idx/(N-1)
  const rawNorm = idx / (total - 1);
  return INVERT_SLUGS.has(dim.slug) ? 1 - rawNorm : rawNorm;
}

function colorClassFromNorm(norm: number): { bar: string; chip: string } {
  if (norm < 0.25) return { bar: "bg-rose-400", chip: "🔴" };
  if (norm < 0.5) return { bar: "bg-amber-400", chip: "🟠" };
  if (norm < 0.75) return { bar: "bg-lime-400", chip: "🟡" };
  return { bar: "bg-emerald-400", chip: "🟢" };
}

// Generate cross-dimensional insights — pakai norm langsung (bukan severity heuristic)
function generateInsights(dims: Dim[]): { kind: "concern" | "strength" | "paradox" | "general"; text: string }[] {
  const norm = new Map(dims.map((d) => [d.slug, computeNorm(d)]));
  const isProblem = (slug: string) => (norm.get(slug) ?? 0.5) < 0.4;  // kondisi buruk
  const isStrength = (slug: string) => (norm.get(slug) ?? 0.5) > 0.7; // kondisi baik

  const insights: { kind: "concern" | "strength" | "paradox" | "general"; text: string }[] = [];

  // 1. Compound risk: Burnout buruk + Self-Compassion buruk
  if (isProblem("burnout") && isProblem("selfcompassion")) {
    insights.push({
      kind: "concern",
      text: "Pola compound risk: burnout tinggi diperburuk oleh self-criticism yang keras. Otak yang lelah ditambah self-judgment yang ga lembut — kombinasi yang gampang nyeret ke depresi. Prioritas: latih self-compassion + ambil jeda nyata (cuti, libur weekend tanpa kerja).",
    });
  }

  // 2. Compound protection: Resiliensi baik + Psych Safety baik
  if (isStrength("resiliensi") && isStrength("psychsafety")) {
    insights.push({
      kind: "strength",
      text: "Kekuatan kamu: kemampuan bouncing back yang baik + lingkungan supportive. Ini fondasi yang solid. Manfaatkan saat lagi nge-down, dan sebarin ke orang lain yang lagi struggle juga.",
    });
  }

  // 3. Paradox protective: Self-Esteem buruk tapi Resiliensi baik
  if (isProblem("selfesteem") && isStrength("resiliensi")) {
    insights.push({
      kind: "paradox",
      text: "Paradox: self-esteem kamu rendah tapi resiliensi tinggi. Artinya kamu udah lewatin banyak situasi sulit dan bertahan — tapi diri belum recognize sendiri. Bukti udah ada, tinggal kasih diri kredit. Coba game Pikiran Mirror atau Tantang Pikiran untuk reframing self-view.",
    });
  }

  // 4. Digital escape: Burnout buruk + Digital buruk
  if (isProblem("burnout") && isProblem("digital")) {
    insights.push({
      kind: "concern",
      text: "Pattern terdeteksi: digital usage berlebih bareng burnout. Sering kali, hp jadi escape dari kelelahan — tapi escape lewat scrolling justru menguras energi lebih. Coba: hapus 1 app paling sering dipake selama 1 minggu, gantiin sama aktivitas off-screen.",
    });
  }

  // 5. Hubungan dengan diri keras: Self-Compassion + Self-Esteem dua-duanya buruk
  if (isProblem("selfcompassion") && isProblem("selfesteem")) {
    insights.push({
      kind: "concern",
      text: "Self-compassion rendah + self-esteem rendah = hubungan dengan diri sendiri lagi keras. Ini area yang paling impact ke quality of life keseluruhan. Saran: latih dialog diri kayak ngomong ke sahabat. Coba game Tantang Pikiran (CBT) untuk challenge pola self-critical.",
    });
  }

  // 6. Lingkungan unsafe: Psych Safety buruk
  if (isProblem("psychsafety")) {
    insights.push({
      kind: "concern",
      text: "Lingkungan kerja/sekolah kamu cenderung kurang aman psikologis. Ini mempengaruhi semua dimensi lain — susah recover (resiliensi), gampang capek (burnout), self-doubt naik. Pertimbangkan: evaluasi lingkungan, atau cari 1-2 trusted person dalam lingkungan itu sebagai safe zone.",
    });
  }

  // 7. All good: semua dimensi baik
  const allGood = dims.every((d) => isStrength(d.slug));
  if (allGood) {
    insights.push({
      kind: "strength",
      text: "Profil kamu solid di semua dimensi MHCU. Ini bukan berarti sempurna — tapi fondasi mental kamu sehat. Pertahankan ritme yang lagi jalan ini. Cek ulang per bulan biar tau pattern over time.",
    });
  }

  // 8. Default fallback
  if (insights.length === 0) {
    insights.push({
      kind: "general",
      text: "Profil kamu beragam — ada area yang kuat, ada yang masih perlu perhatian. Fokus dulu ke 1-2 dimensi yang paling concerning (lihat highlight merah di bar di atas). Jangan coba fix semua sekaligus — pelan-pelan.",
    });
  }

  return insights;
}

export function MhcuComprehensiveReport({ dimensions }: { dimensions: Dim[] }) {
  const latestDate = dimensions.reduce((latest, d) => (d.created_at > latest ? d.created_at : latest), dimensions[0].created_at);
  const insights = generateInsights(dimensions);

  // Pre-compute norm + color per dim sekali
  const dimViews = dimensions.map((d) => {
    const norm = computeNorm(d);
    const { bar, chip } = colorClassFromNorm(norm);
    return { ...d, norm, barColor: bar, chip };
  });

  // Anomaly: dimensi yang norm-nya < 0.4 (concerning)
  const anomalies = dimViews.filter((d) => d.norm < 0.4).sort((a, b) => a.norm - b.norm);

  return (
    <LaporanShell title="Laporan MHCU Komprehensif" takenAt={latestDate}>
      <HeroCard
        emoji="🌱"
        label="Mental Health Check-Up"
        headline="Profil komprehensif"
        value={`Hasil agregasi dari ${dimensions.length} dimensi kesehatan mental kamu`}
        gradient="from-emerald-400 via-teal-400 to-sky-400"
      />

      {/* 6 Dimensi bar viz */}
      <LaporanSection icon="📊" title="6 Dimensi Mental Health" hint="Lihat profil kamu dalam 1 view">
        <div className="flex flex-col gap-3">
          {dimViews.map((d) => (
            <div key={d.slug}>
              <div className="flex flex-wrap items-baseline justify-between gap-1 text-xs">
                <span className="font-medium text-ink">
                  <span className="mr-1">{d.chip}</span>{d.name}
                </span>
                <span className="text-ink/55">{d.band_label} ({d.score}/{d.max})</span>
              </div>
              <div className="mt-1 h-3 rounded-full bg-ink/5 overflow-hidden">
                <div className={`h-full rounded-full ${d.barColor} transition-all`} style={{ width: `${Math.max(d.norm * 100, 4)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] italic text-ink/45">
          Bar panjang = kondisi baik di dimensi tsb. Warna: 🟢 baik, 🟡 sedang, 🟠 mulai concern, 🔴 perlu perhatian.
        </p>
      </LaporanSection>

      {/* Anomaly section — rekam medis style highlight */}
      {anomalies.length > 0 && (
        <LaporanSection icon="🔴" title="Dimensi yang Perlu Perhatian" hint="Area yang skornya di bawah aman — prioritas fokus">
          <div className="flex flex-col gap-2">
            {anomalies.map((a) => (
              <div key={a.slug} className="rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200">
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <p className="text-sm font-bold text-ink">{a.name}</p>
                  <p className="text-xs italic text-rose-700">{a.band_label}</p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink/70">
                  Skor: {a.score}/{a.max}. Ini area yang paling concerning di profil kamu — fokus dulu di sini buat treatment.
                </p>
              </div>
            ))}
          </div>
        </LaporanSection>
      )}

      {/* Cross-dimensional insights */}
      <LaporanSection icon="💡" title="Insight lintas-dimensi" hint="Pola yang muncul saat semua dimensi dilihat bersama">
        <div className="flex flex-col gap-3">
          {insights.map((ins, i) => {
            const kindStyle = {
              concern: { bg: "bg-rose-50 ring-rose-200", icon: "⚠️", label: "Perlu perhatian" },
              strength: { bg: "bg-emerald-50 ring-emerald-200", icon: "💪", label: "Kekuatan kamu" },
              paradox: { bg: "bg-purple-50 ring-purple-200", icon: "🔮", label: "Pola menarik" },
              general: { bg: "bg-sky-50 ring-sky-200", icon: "📝", label: "Catatan" },
            }[ins.kind];
            return (
              <div key={i} className={`rounded-xl ${kindStyle.bg} p-3 ring-1`}>
                <p className="text-xs font-bold uppercase tracking-wide text-ink/65">{kindStyle.icon} {kindStyle.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/80">{ins.text}</p>
              </div>
            );
          })}
        </div>
      </LaporanSection>

      {/* Per-dimensi quick links (drill-down) */}
      <LaporanSection icon="🔗" title="Lihat laporan per dimensi">
        <ul className="flex flex-col gap-1">
          {dimViews.map((d) => (
            <li key={d.slug}>
              <a href={`/laporan/screening_${d.slug}`} className="flex items-center justify-between rounded-lg bg-white/60 p-2 text-xs hover:bg-sky-50">
                <span className="text-ink/80">
                  <span className="mr-1">{d.chip}</span>{d.name}
                </span>
                <span className="italic text-ink/50">{d.band_label} →</span>
              </a>
            </li>
          ))}
        </ul>
      </LaporanSection>

      <LaporanActions retakeHref="/skrining" />
    </LaporanShell>
  );
}
