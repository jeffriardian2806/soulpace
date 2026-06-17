import { LaporanShell, LaporanSection, LaporanActions, HeroCard } from "./LaporanShell";
import { CRISIS_RESOURCE } from "@/core/crisisResources";

type Instrument = {
  slug: string;
  name: string;
  subtitle: string;
  category: "clinical" | "mhcu" | "other";
  screening_bands: { min_score: number; max_score: number; label: string; advice: string }[];
};

type Detail = { score?: number; max?: number; band_label?: string; band_advice?: string; crisis?: boolean; severity?: string };

// Saran cross-feature berdasarkan jenis instrumen + band severity
function getCrossSuggestions(slug: string, severity: string | undefined): string[] {
  const sevs = severity ?? "minimal";
  const high = sevs === "severe" || sevs === "moderate";

  if (slug === "phq9") {
    return high
      ? ["Pertimbangkan konsultasi ke psikolog atau psikiater.", "Coba Tarik Napas atau Grounding 5-4-3-2-1 saat ngerasa overwhelmed.", "Tetap jaga rutinitas tidur & makan, sekecil apapun."]
      : ["Coba Mood Tracker harian biar bisa lihat pola.", "Latihan refleksi via Jurnal Pribadi."];
  }
  if (slug === "gad7") {
    return high
      ? ["Cemas berat butuh strategi: coba Grounding 5-4-3-2-1 atau Tarik Napas 4-7-8.", "Pertimbangkan konsultasi profesional.", "Hindari kafein berlebihan & jaga jadwal tidur."]
      : ["Coba game Monster Cemas — latihan challenge pikiran cemas.", "Jadwalin worry time 15 menit/hari, sisanya tahan."];
  }
  if (slug === "burnout") {
    return high
      ? ["Pertimbangkan istirahat lebih panjang (cuti, libur weekend tanpa kerja).", "Ngobrol sama atasan/wali soal beban.", "Coba Ruang Hening atau Tarik Napas tiap 2 jam kerja."]
      : ["Identifikasi: aktivitas mana yang paling drain? Bisa dikurangi atau didelegasikan?", "Jaga boundary kerja-istirahat (no work after X jam)."];
  }
  if (slug === "selfesteem") {
    return ["Coba Pikiran Mirror buat liat profil dirimu — banyak hal positif yang sering ke-skip.", "Latihan Tantang Pikiran (CBT) buat challenge pikiran self-critical.", "Tulis 3 hal yang kamu lakuin baik hari ini di Jurnal Syukur."];
  }
  if (slug === "selfcompassion") {
    return ["Latihan: tiap kali kamu nge-judge diri sendiri, coba ajak ngomong diri kayak ngomong ke sahabat.", "Coba Tantang Pikiran — banyak pola self-judgment yang bisa di-reframe.", "Inget: orang lain ngerasain hal serupa juga (common humanity)."];
  }
  if (slug === "resiliensi") {
    return ["Resiliensi bisa dilatih — coba mulai dari recovery time pendek (mis. journaling setelah hari berat).", "Identifikasi support system yang konsisten (1-2 orang aja udah cukup).", "Latihan Mindfulness via Tarik Napas atau Grounding."];
  }
  if (slug === "digital") {
    return high
      ? ["Set boundary konkret: no-phone bedroom, app limit di settings hp.", "Coba puasa medsos 1 hari/minggu.", "Identifikasi: kamu cari apa di hp itu? Sering kali itu coping mechanism dari hal lain."]
      : ["Tetap jaga digital hygiene — tetap pakai grace, bukan kompulsi."];
  }
  if (slug === "psychsafety") {
    return ["Kalau skor rendah, evaluasi lingkungan: apakah ini sehat buat kamu jangka panjang?", "Cari 1-2 orang trusted di lingkungan untuk bangun safe zone.", "Diskusi dengan atasan/pembimbing soal pola yang nyusahin (kalau memungkinkan)."];
  }
  return ["Refleksi: apa yang skor ini ngasih kamu tau soal kondisi sekarang?", "Konsultasi profesional kalau merasa butuh sounding board."];
}

export function ScreeningLaporan({ result, instrument }: { result: { summary: { headline: string; value?: string }; detail: Detail | null; created_at: string }; instrument: Instrument }) {
  const detail = result.detail ?? {};
  const score = detail.score ?? 0;
  const max = detail.max ?? 1;
  const bandLabel = detail.band_label ?? result.summary.headline;
  const bandAdvice = detail.band_advice ?? "";
  const crisis = detail.crisis === true;
  const severity = detail.severity;
  const pct = max > 0 ? (score / max) * 100 : 0;

  const isClinical = instrument.category === "clinical";
  const gradient = crisis
    ? "from-rose-500 via-orange-500 to-amber-500"
    : severity === "severe"
      ? "from-rose-400 via-orange-400 to-amber-400"
      : isClinical
        ? "from-sky-400 via-blue-400 to-indigo-400"
        : "from-emerald-400 via-teal-400 to-sky-400";

  const suggestions = getCrossSuggestions(instrument.slug, severity);
  const slug = instrument.slug;

  return (
    <LaporanShell title={instrument.name} takenAt={result.created_at}>
      <HeroCard
        emoji={isClinical ? "📋" : "🌱"}
        label={isClinical ? "Hasil skrining klinis" : "Hasil MHCU"}
        headline={bandLabel}
        value={`Skor kamu: ${score} / ${max}`}
        gradient={gradient}
      />

      {/* Position bar — visualisasi posisi skor di antara semua band */}
      <LaporanSection icon="📏" title="Posisi skor kamu" hint="Di mana skor kamu berada di rentang semua band">
        <div className="relative">
          <div className="flex h-3 overflow-hidden rounded-full">
            {instrument.screening_bands.map((b, i) => {
              const bandWidth = ((b.max_score - b.min_score + 1) / max) * 100;
              const isCurrent = score >= b.min_score && score <= b.max_score;
              return (
                <div
                  key={i}
                  className={`${isCurrent ? "bg-gradient-to-r from-sky-400 to-purple-500" : "bg-ink/10"}`}
                  style={{ width: `${bandWidth}%` }}
                  title={`${b.label} (${b.min_score}-${b.max_score})`}
                />
              );
            })}
          </div>
          <div className="relative mt-1 h-4">
            <div
              className="absolute -translate-x-1/2 text-xs font-bold text-ink"
              style={{ left: `${Math.min(100, pct)}%` }}
            >
              ▲
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-ink/55">
            {instrument.screening_bands.map((b, i) => (
              <span key={i} className={score >= b.min_score && score <= b.max_score ? "font-bold text-ink" : ""}>
                {b.label}: {b.min_score}-{b.max_score}
              </span>
            ))}
          </div>
        </div>
      </LaporanSection>

      {bandAdvice && (
        <LaporanSection icon="💡" title="Apa artinya">
          <p className="text-sm leading-relaxed text-ink/80">{bandAdvice}</p>
        </LaporanSection>
      )}

      <LaporanSection icon="🎯" title="Saran konkret">
        <ul className="flex flex-col gap-2 text-sm text-ink/80">
          {suggestions.map((s, i) => (
            <li key={i} className="flex gap-2"><span>•</span><span dangerouslySetInnerHTML={{ __html: s.replace(/Pikiran Mirror|Tantang Pikiran|Tarik Napas|Grounding 5-4-3-2-1|Mood Tracker|Jurnal Pribadi|Jurnal Syukur|Ruang Hening|Monster Cemas/g, (m) => `<strong>${m}</strong>`) }} /></li>
          ))}
        </ul>
      </LaporanSection>

      {(crisis || severity === "severe") && (
        <div className="rounded-2xl bg-rose-50 ring-2 ring-rose-200 p-4">
          <p className="text-sm font-bold text-rose-700">🆘 Crisis support</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/85">
            Skor kamu menunjukkan kondisi yang butuh perhatian segera. Kamu tidak sendirian — hubungi <strong>{CRISIS_RESOURCE.orgName}</strong> di <strong>{CRISIS_RESOURCE.phone}</strong>{CRISIS_RESOURCE.url && (<> atau kunjungi <a href={CRISIS_RESOURCE.url} className="underline" target="_blank" rel="noopener">{CRISIS_RESOURCE.url}</a></>)}. Gratis, 24 jam.
          </p>
        </div>
      )}

      <LaporanActions retakeHref={`/skrining/${slug}`} />
    </LaporanShell>
  );
}
