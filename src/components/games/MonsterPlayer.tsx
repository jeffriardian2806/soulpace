"use client";
import { useState } from "react";

export type MonsterResponse = { text: string; effect: "grow" | "shrink" | "stay"; insight: string };
export type MonsterSituation = { id: string; situation: string; responses: MonsterResponse[] };

export function MonsterPlayer({ situations }: { situations: MonsterSituation[] }) {
  const [idx, setIdx] = useState(0);
  const [size, setSize] = useState(100);  // 0-200
  const [picked, setPicked] = useState<number | null>(null);
  if (situations.length === 0) return <p className="text-sm text-ink/50">Situasi belum tersedia.</p>;

  const done = idx >= situations.length;
  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="text-7xl" style={{ transform: `scale(${size / 100})`, transition: "transform 0.6s" }}>
          {size > 130 ? "👹" : size < 80 ? "👻" : "😈"}
        </div>
        <p className="text-base font-medium text-ink">
          {size < 80 ? "Monster mengecil." : size > 130 ? "Monster membesar." : "Monster tetap seukuran semula."}
        </p>
        <p className="max-w-sm text-center text-sm leading-relaxed text-ink/65">
          {size < 80 ? "Lo udah praktekin tantang pikiran — monster ga punya banyak makanan. Tetap latihan." :
           size > 130 ? "Pikiran yang lo turutin terus bikin monster lebih kuat. Coba ulang dengan respons beda — itu skill bukan bakat." :
           "Lo netral. Coba lagi dengan respons yang lebih challenge pikirannya."}
        </p>
        <button onClick={() => { setIdx(0); setSize(100); setPicked(null); }} className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white">Main lagi</button>
      </div>
    );
  }

  const s = situations[idx];
  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const r = s.responses[i];
    if (r.effect === "grow") setSize((x) => Math.min(200, x + 20));
    else if (r.effect === "shrink") setSize((x) => Math.max(0, x - 20));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink/45 text-center">{idx + 1} / {situations.length}</p>
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="text-6xl" style={{ transform: `scale(${size / 100})`, transition: "transform 0.6s" }}>
          {size > 130 ? "👹" : size < 80 ? "👻" : "😈"}
        </div>
        <div className="h-1.5 w-32 rounded-full bg-ink/5">
          <div className="h-full rounded-full bg-rose-400" style={{ width: `${(size / 200) * 100}%`, transition: "width 0.6s" }} />
        </div>
      </div>
      <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Monster bilang:</p>
        <p className="mt-1 text-sm italic leading-relaxed text-ink/85">{s.situation}</p>
      </div>
      <p className="text-center text-xs text-ink/50">Respons kamu?</p>
      <div className="flex flex-col gap-2">
        {s.responses.map((r, i) => {
          const isPicked = picked === i;
          return (
            <button key={i} onClick={() => pick(i)} disabled={picked !== null}
              className={`rounded-2xl border p-3 text-left text-sm transition-all ${
                isPicked
                  ? r.effect === "shrink" ? "border-emerald-400 bg-emerald-50" : r.effect === "grow" ? "border-rose-400 bg-rose-50" : "border-ink/20 bg-ink/5"
                  : picked !== null ? "border-ink/10 bg-white/40 opacity-50" : "border-sky-100 bg-white/70 hover:border-sky-400 hover:bg-sky-50 active:scale-[0.98]"
              }`}>
              {r.text}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="rounded-2xl bg-sky-50 p-4">
          <p className="text-xs font-semibold text-sky-700">
            {s.responses[picked].effect === "shrink" ? "🔻 Monster mengecil" : s.responses[picked].effect === "grow" ? "🔺 Monster membesar" : "➡ Tetap"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink/75">{s.responses[picked].insight}</p>
          <button onClick={() => { setIdx(idx + 1); setPicked(null); }} className="mt-3 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white">Lanjut →</button>
        </div>
      )}
    </div>
  );
}
