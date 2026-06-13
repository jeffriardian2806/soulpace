"use client";
import { useState } from "react";

export type VoiceScenario = { id: string; situation: string; critic_text: string; supportive_text: string; outcome_critic: string; outcome_supportive: string };

export function SuaraPlayer({ scenarios }: { scenarios: VoiceScenario[] }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<"critic" | "supportive" | null>(null);
  if (scenarios.length === 0) return <p className="text-sm text-ink/50">Skenario belum tersedia.</p>;

  const done = idx >= scenarios.length;
  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-5xl">🌱</p>
        <p className="text-base font-medium text-ink">Selesai.</p>
        <p className="max-w-sm text-center text-sm leading-relaxed text-ink/65">
          Suara mana yang lebih sering kamu denger? Itu yang tumbuh. Kamu bisa pilih siapa yang kasih ruang.
        </p>
        <button onClick={() => { setIdx(0); setPicked(null); }} className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white">Ulang</button>
      </div>
    );
  }

  const s = scenarios[idx];
  const outcome = picked === "critic" ? s.outcome_critic : picked === "supportive" ? s.outcome_supportive : null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink/45 text-center">{idx + 1} / {scenarios.length}</p>
      <div className="rounded-2xl border-2 border-sky-200 bg-white p-4 shadow-lg">
        <p className="text-sm leading-relaxed text-ink">{s.situation}</p>
      </div>
      <div className="flex flex-col gap-3">
        <button onClick={() => !picked && setPicked("critic")} disabled={!!picked}
          className={`rounded-2xl border-2 p-4 text-left transition-all ${
            picked === "critic" ? "border-rose-400 bg-rose-50" :
            picked ? "border-ink/10 bg-white/40 opacity-50" :
            "border-rose-200 bg-rose-50/40 hover:bg-rose-50 active:scale-[0.98]"
          }`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">😠 Suara Kritis</p>
          <p className="mt-1 text-sm italic text-ink/85">&ldquo;{s.critic_text}&rdquo;</p>
        </button>
        <button onClick={() => !picked && setPicked("supportive")} disabled={!!picked}
          className={`rounded-2xl border-2 p-4 text-left transition-all ${
            picked === "supportive" ? "border-emerald-400 bg-emerald-50" :
            picked ? "border-ink/10 bg-white/40 opacity-50" :
            "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 active:scale-[0.98]"
          }`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">🌿 Suara Supportive</p>
          <p className="mt-1 text-sm italic text-ink/85">&ldquo;{s.supportive_text}&rdquo;</p>
        </button>
      </div>
      {picked && outcome && (
        <div className={`rounded-2xl p-4 ${picked === "critic" ? "bg-rose-50" : "bg-emerald-50"}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Kalo lo denger suara ini:</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/85">{outcome}</p>
          <button onClick={() => { setIdx(idx + 1); setPicked(null); }} className="mt-3 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white">Lanjut →</button>
        </div>
      )}
    </div>
  );
}
