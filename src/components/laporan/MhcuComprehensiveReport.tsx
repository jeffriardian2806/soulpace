import { LaporanShell, LaporanSection, LaporanActions, HeroCard } from "./LaporanShell";

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
};

// Map severity → normalized score 0-1 (1 = paling baik)
// Buat dimensi where lower = better (Burnout, Digital), invert
const INVERT_SLUGS = new Set(["burnout", "digital"]);

function severityToNorm(severity: string, invert: boolean): number {
  const baseMap: Record<string, number> = { minimal: 1, mild: 0.7, moderate: 0.4, severe: 0.1 };
  let v = baseMap[severity] ?? 0.5;
  if (invert) v = 1 - v;
  return v;
}

// Generate cross-dimensional insights berdasarkan kombinasi severity
function generateInsights(dims: Dim[]): { kind: "concern" | "strength" | "paradox" | "general"; text: string }[] {
  const map = new Map(dims.map((d) => [d.slug, d]));
  const insights: { kind: "concern" | "strength" | "paradox" | "general"; text: string }[] = [];

  const burnoutSev = map.get("burnout")?.severity;
  const selfEsteem = map.get("selfesteem")?.severity;
  const selfCompassion = map.get("selfcompassion")?.severity;
  const resiliensi = map.get("resiliensi")?.severity;
  const digital = map.get("digital")?.severity;
  const psychSafety = map.get("psychsafety")?.severity;

  // Helper untuk cek "low" pada dimensi where higher = better
  const isLow = (sev: string | undefined, invert: boolean) => {
    if (!sev) return false;
    if (invert) return sev === "minimal" || sev === "mild";
    return sev === "severe" || sev === "moderate";
  };
  const isHigh = (sev: string | undefined, invert: boolean) => {
    if (!sev) return false;
    if (invert) return sev === "severe" || sev === "moderate";
    return sev === "minimal" || sev === "mild";
  };

  // 1. Compound risk: Burnout tinggi + Self-Compassion rendah
  if (isLow(burnoutSev, true) && isLow(selfCompassion, false)) {
    insights.push({
      kind: "concern",
      text: "Pola compound risk: burnout tinggi diperburuk oleh self-criticism yang keras. Otak yang lelah ditambah dengan self-judgment yang ga lembut — kombinasi yang gampang nyeret ke depresi. Prioritas: latih self-compassion + ambil jeda nyata (cuti, libur weekend tanpa kerja).",
    });
  }

  // 2. Compound protection: Resiliensi tinggi + Psych Safety aman
  if (isHigh(resiliensi, false) && isHigh(psychSafety, false)) {
    insights.push({
      kind: "strength",
      text: "Kekuatan kamu: kemampuan bouncing back yang baik + lingkungan supportive. Ini fondasi yang solid. Manfaatkan saat lagi nge-down, dan sebarin ke orang lain yang lagi struggle juga.",
    });
  }

  // 3. Paradox protective: Self-Esteem rendah tapi Resiliensi tinggi
  if (isLow(selfEsteem, false) && isHigh(resiliensi, false)) {
    insights.push({
      kind: "paradox",
      text: "Paradox: self-esteem kamu rendah tapi resiliensi kamu tinggi. Artinya, kamu udah lewatin banyak situasi sulit dan bertahan — tapi diri belum nge-recognize sendiri. Bukti udah ada, tinggal kasih diri kredit. Coba game Pikiran Mirror atau Tantang Pikiran untuk reframing self-view.",
    });
  }

  // 4. Digital escape: Burnout tinggi + Digital problematic
  if (isLow(burnoutSev, true) && isLow(digital, true)) {
    insights.push({
      kind: "concern",
      text: "Pattern terdeteksi: digital usage berlebih bareng burnout. Sering kali, hp jadi escape dari kelelahan — tapi escape lewat scrolling justru menguras energi lebih. Coba: hapus 1 app paling sering dipake selama 1 minggu, gantiin sama aktivitas off-screen.",
    });
  }

  // 5. Self-compassion + esteem: dua-duanya rendah
  if (isLow(selfCompassion, false) && isLow(selfEsteem, false)) {
    insights.push({
      kind: "concern",
      text: "Self-compassion rendah + self-esteem rendah = hubungan dengan diri sendiri lagi keras. Ini area yang paling impact ke quality of life keseluruhan. Saran: latih dialog diri kayak ngomong ke sahabat. Coba game Tantang Pikiran (CBT) untuk challenge pola self-critical.",
    });
  }

  // 6. Psych safety rendah
  if (isLow(psychSafety, false)) {
    insights.push({
      kind: "concern",
      text: "Lingkungan kerja/sekolah kamu cenderung kurang aman psikologis. Ini mempengaruhi semua dimensi lain — susah recover (resiliensi), gampang capek (burnout), self-doubt naik. Pertimbangkan: evaluasi lingkungan, atau cari 1-2 trusted person dalam lingkungan itu sebagai safe zone.",
    });
  }

  // 7. All high (semua dimensi protective)
  const allGood = dims.every((d) => {
    const invert = INVERT_SLUGS.has(d.slug);
    return isHigh(d.severity, invert);
  });
  if (allGood) {
    insights.push({
      kind: "strength",
      text: "Profil kamu solid di semua dimensi MHCU. Ini bukan berarti sempurna — tapi fondasi mental kamu sehat. Pertahankan ritme yang lagi jalan ini. Cek ulang per bulan biar tau pattern over time.",
    });
  }

  // 8. Default kalau ga ada pattern khusus
  if (insights.length === 0) {
    insights.push({
      kind: "general",
      text: "Profil kamu beragam — ada area yang kuat, ada yang masih perlu perhatian. Fokus dulu ke 1-2 dimensi yang paling concerning (lihat highlight merah di radar di atas). Jangan coba fix semua sekaligus — pelan-pelan.",
    });
  }

  return insights;
}

export function MhcuComprehensiveReport({ dimensions }: { dimensions: Dim[] }) {
  // Tanggal kompletisi terbaru
  const latestDate = dimensions.reduce((latest, d) => (d.created_at > latest ? d.created_at : latest), dimensions[0].created_at);

  // Insights
  const insights = generateInsights(dimensions);

  // Severity color map untuk visual
  const sevColor = (severity: string, invert: boolean) => {
    const sev = invert ? { minimal: "rose", mild: "amber", moderate: "lime", severe: "emerald" }[severity] : { minimal: "emerald", mild: "lime", moderate: "amber", severe: "rose" }[severity];
    return sev ?? "ink";
  };

  return (
    <LaporanShell title="Laporan MHCU Komprehensif" takenAt={latestDate}>
      <HeroCard
        emoji="🌱"
        label="Mental Health Check-Up"
        headline="Profil komprehensif"
        value={`Hasil agregasi dari ${dimensions.length} dimensi kesehatan mental kamu`}
        gradient="from-emerald-400 via-teal-400 to-sky-400"
      />

      {/* Radar-ish: bar chart 6 dimensi */}
      <LaporanSection icon="📊" title="6 Dimensi Mental Health" hint="Lihat profil kamu dalam 1 view">
        <div className="flex flex-col gap-3">
          {dimensions.map((d) => {
            const invert = INVERT_SLUGS.has(d.slug);
            const norm = severityToNorm(d.severity, invert);
            const colorBase = sevColor(d.severity, invert);
            const colorMap: Record<string, string> = {
              emerald: "bg-emerald-400",
              lime: "bg-lime-400",
              amber: "bg-amber-400",
              rose: "bg-rose-400",
              ink: "bg-ink/30",
            };
            const barColor = colorMap[colorBase];
            return (
              <div key={d.slug}>
                <div className="flex flex-wrap items-baseline justify-between gap-1 text-xs">
                  <span className="font-medium text-ink">{d.name}</span>
                  <span className="text-ink/55">{d.band_label} ({d.score}/{d.max})</span>
                </div>
                <div className="mt-1 h-3 rounded-full bg-ink/5 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${norm * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] italic text-ink/45">
          Bar panjang = kondisi baik di dimensi tsb. Warna: 🟢 baik, 🟡 sedang, 🟠 mulai concern, 🔴 perlu perhatian.
        </p>
      </LaporanSection>

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

      {/* Per-dimensi quick links */}
      <LaporanSection icon="🔗" title="Lihat laporan per dimensi">
        <ul className="flex flex-col gap-1">
          {dimensions.map((d) => (
            <li key={d.slug}>
              <a href={`/laporan/screening_${d.slug}`} className="flex items-center justify-between rounded-lg bg-white/60 p-2 text-xs hover:bg-sky-50">
                <span className="text-ink/80">{d.name}</span>
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
