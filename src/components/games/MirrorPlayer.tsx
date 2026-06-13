"use client";
import { useState } from "react";

export type MirrorProfile = { slug: string; name: string; emoji: string; description: string; insight: string };
export type MirrorOption = { text: string; profile_slug: string };
export type MirrorScenario = { id: string; category: string; situation: string; options: MirrorOption[] };

export function MirrorPlayer({ scenarios, profiles }: { scenarios: MirrorScenario[]; profiles: MirrorProfile[] }) {
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  if (scenarios.length === 0 || profiles.length === 0) return <p className="text-sm text-ink/50">Konten belum tersedia. Hubungi admin.</p>;

  const done = idx >= scenarios.length;

  if (done) {
    // Tally
    const counts: Record<string, number> = {};
    picks.forEach((p) => { counts[p] = (counts[p] ?? 0) + 1; });
    let topSlug = picks[0]; let topCount = 0;
    Object.entries(counts).forEach(([k, v]) => { if (v > topCount) { topSlug = k; topCount = v; } });
    const profile = profiles.find((p) => p.slug === topSlug) ?? profiles[0];

    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="rounded-3xl bg-gradient-to-br from-sky-400 to-purple-500 p-8 text-center text-white shadow-2xl">
          <p className="text-6xl">{profile.emoji}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-white/70">Profil kamu</p>
          <p className="mt-1 text-2xl font-bold">{profile.name}</p>
          <p className="mt-3 text-sm leading-relaxed text-white/90">{profile.description}</p>
        </div>
        <div className="rounded-2xl bg-sky-50 p-4">
          <p className="text-sm font-bold text-ink">Insight</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/75">{profile.insight}</p>
        </div>
        <p className="text-xs text-ink/45">Bukan diagnosis. Cuma cermin pelan-pelan dari respons kamu hari ini.</p>
        <button onClick={() => { setIdx(0); setPicks([]); }} className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white">Coba lagi</button>
      </div>
    );
  }

  const s = scenarios[idx];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">{s.category}</span>
        <p className="text-xs text-ink/45">{idx + 1} / {scenarios.length}</p>
      </div>
      <div className="rounded-2xl border-2 border-sky-200 bg-white p-5 shadow-lg">
        <p className="text-base leading-relaxed text-ink">{s.situation}</p>
      </div>
      <div className="flex flex-col gap-2">
        {s.options.map((o, i) => (
          <button key={i} onClick={() => { setPicks([...picks, o.profile_slug]); setIdx(idx + 1); }}
            className="rounded-2xl border border-sky-100 bg-white/70 p-4 text-left text-sm text-ink/80 transition-colors hover:border-sky-400 hover:bg-sky-50 active:scale-[0.98]">
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}
