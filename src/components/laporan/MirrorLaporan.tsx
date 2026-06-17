import { LaporanShell, LaporanSection, LaporanActions, HeroCard } from "./LaporanShell";

type MirrorProfile = { slug: string; name: string; emoji: string; description: string; insight: string };
type Detail = { profile_slug?: string; picks?: string[] };

export function MirrorLaporan({ result, profiles }: { result: { summary: { headline: string; value?: string; emoji?: string }; detail: Detail | null; created_at: string }; profiles: MirrorProfile[] }) {
  const detail = result.detail ?? {};
  const myProfile = profiles.find((p) => p.slug === detail.profile_slug) ?? null;
  const picks = detail.picks ?? [];

  // Tally picks per profile
  const counts: Record<string, number> = {};
  picks.forEach((s) => { counts[s] = (counts[s] ?? 0) + 1; });
  const total = picks.length;
  const tally = profiles
    .map((p) => ({ profile: p, count: counts[p.slug] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <LaporanShell title="Pikiran Mirror" takenAt={result.created_at}>
      <HeroCard
        emoji={myProfile?.emoji ?? result.summary.emoji}
        label="Profil kamu"
        headline={myProfile?.name ?? result.summary.headline}
        value={myProfile?.description ?? result.summary.value}
      />

      <LaporanSection icon="💡" title="Insight" hint="Apa artinya buat kamu">
        <p className="text-sm leading-relaxed text-ink/80">{myProfile?.insight ?? "Insight belum tersedia."}</p>
      </LaporanSection>

      {total > 0 && (
        <LaporanSection icon="📊" title="Breakdown jawaban" hint={`Dari ${total} skenario, kamu cenderung memilih respons:`}>
          <div className="flex flex-col gap-2">
            {tally.map(({ profile, count }) => {
              const pct = total > 0 ? (count / total) * 100 : 0;
              const isTop = profile.slug === detail.profile_slug;
              return (
                <div key={profile.slug}>
                  <div className="flex justify-between text-xs">
                    <span className={isTop ? "font-bold text-ink" : "text-ink/65"}>{profile.emoji} {profile.name}</span>
                    <span className="text-ink/55 tabular-nums">{count} / {total}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-ink/5">
                    <div className={`h-full rounded-full ${isTop ? "bg-gradient-to-r from-sky-400 to-purple-500" : "bg-ink/20"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </LaporanSection>
      )}

      <LaporanSection icon="🎯" title="Saran konkret">
        <ul className="flex flex-col gap-2 text-sm text-ink/80">
          <li className="flex gap-2"><span>•</span><span>Refleksi: kapan kamu paling sering di kondisi profil ini? Situasi apa yang memicunya?</span></li>
          <li className="flex gap-2"><span>•</span><span>Coba game <strong>Tantang Pikiran</strong> kalau ada pola pikir yang berulang & kamu pengen challenge.</span></li>
          <li className="flex gap-2"><span>•</span><span>Coba <strong>Spektrum Sosial</strong> kalau pengen lebih dalam soal pola sosial kamu.</span></li>
        </ul>
      </LaporanSection>

      <LaporanActions retakeHref="/main/cermin" />
    </LaporanShell>
  );
}
