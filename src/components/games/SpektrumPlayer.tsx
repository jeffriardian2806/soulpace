"use client";
import { useState } from "react";

export type SpektrumOption = { text: string; intro_weight: number; extro_weight: number };
export type SpektrumQuestion = { id: string; category_id: string; text: string; options: SpektrumOption[] };
export type SpektrumCategory = { id: string; slug: string; name: string; emoji: string; description: string };

export function SpektrumPlayer({ categories, questions }: { categories: SpektrumCategory[]; questions: SpektrumQuestion[] }) {
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<SpektrumOption[]>([]);
  const [showCategory, setShowCategory] = useState(true); // intro screen per kategori

  if (categories.length === 0 || questions.length === 0) {
    return <p className="text-sm text-ink/50">Konten belum tersedia.</p>;
  }

  // Group questions by category, in order categories
  const byCategory = categories.map((c) => ({ category: c, questions: questions.filter((q) => q.category_id === c.id) }));
  const flatOrder: { q: SpektrumQuestion; category: SpektrumCategory; isFirstInCategory: boolean }[] = [];
  byCategory.forEach(({ category, questions: qs }) => {
    qs.forEach((q, i) => flatOrder.push({ q, category, isFirstInCategory: i === 0 }));
  });

  const done = idx >= flatOrder.length;

  if (done) {
    // Tally
    let totalIntro = 0, totalExtro = 0;
    const byCat: Record<string, { intro: number; extro: number }> = {};
    flatOrder.forEach((item, i) => {
      const p = picks[i];
      if (!p) return;
      totalIntro += p.intro_weight;
      totalExtro += p.extro_weight;
      const k = item.category.id;
      byCat[k] = byCat[k] ?? { intro: 0, extro: 0 };
      byCat[k].intro += p.intro_weight;
      byCat[k].extro += p.extro_weight;
    });
    const sum = totalIntro + totalExtro;
    const introPct = sum > 0 ? (totalIntro / sum) * 100 : 50;
    const extroPct = sum > 0 ? (totalExtro / sum) * 100 : 50;
    const dominant = introPct >= extroPct ? "introvert" : "extrovert";
    const gap = Math.abs(introPct - extroPct);
    const ambivert = gap < 15;

    const insight = ambivert
      ? "Lo termasuk ambivert — punya sisi introvert & extrovert yang seimbang. Bisa adaptasi ke situasi sosial dan ruang sendiri sama-sama nyaman."
      : dominant === "introvert"
        ? "Kecenderungan kamu lebih ke introvert. Lo recharge dari ketenangan, prefer ngobrol dalam dari ke-banyak, dan butuh ruang sendiri buat memproses. Itu bukan kelemahan — itu cara kerja sistem energi lo."
        : "Kecenderungan kamu lebih ke extrovert. Lo recharge dari interaksi, tumbuh di lingkungan sosial, dan sering dapet ide bagus pas ngobrol. Energi lo nyala kalau ada orang.";

    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="rounded-3xl bg-gradient-to-br from-sky-400 via-purple-400 to-rose-400 p-6 text-center text-white shadow-2xl">
          <p className="text-xs uppercase tracking-wide text-white/70">Spektrum kamu</p>
          <p className="mt-2 text-2xl font-bold">{ambivert ? "Ambivert" : dominant === "introvert" ? "Lebih Introvert" : "Lebih Extrovert"}</p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span>🌙 {introPct.toFixed(2)}%</span>
            <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/20">
              <div className="absolute left-0 top-0 h-full bg-white" style={{ width: `${introPct}%` }} />
            </div>
            <span>{extroPct.toFixed(2)}% 🌞</span>
          </div>
        </div>

        <div className="rounded-2xl bg-sky-50 p-4">
          <p className="text-sm leading-relaxed text-ink/80">{insight}</p>
        </div>

        <div className="rounded-2xl bg-white/70 p-4">
          <p className="mb-3 text-sm font-bold text-ink">Breakdown per kategori</p>
          <div className="flex flex-col gap-3">
            {categories.map((c) => {
              const d = byCat[c.id] ?? { intro: 0, extro: 0 };
              const s = d.intro + d.extro;
              const iPct = s > 0 ? (d.intro / s) * 100 : 50;
              return (
                <div key={c.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-ink/75">{c.emoji} {c.name}</span>
                    <span className="text-ink/55 tabular-nums">{iPct.toFixed(0)}% intro / {(100 - iPct).toFixed(0)}% extro</span>
                  </div>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-rose-200">
                    <div className="absolute left-0 top-0 h-full bg-sky-400" style={{ width: `${iPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-ink/40">Bukan diagnosis — ini cuma kecenderungan dari respons lo hari ini.</p>
        <button onClick={() => { setIdx(0); setPicks([]); setShowCategory(true); }} className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white self-center">
          Coba lagi
        </button>
      </div>
    );
  }

  const item = flatOrder[idx];

  // Show category intro card when first question of a new category
  if (item.isFirstInCategory && showCategory) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <p className="text-6xl">{item.category.emoji}</p>
        <p className="text-xs uppercase tracking-wide text-sky-600 font-semibold">
          Kategori {byCategory.findIndex((b) => b.category.id === item.category.id) + 1} / {categories.length}
        </p>
        <p className="text-2xl font-bold text-ink">{item.category.name}</p>
        <p className="max-w-sm text-sm leading-relaxed text-ink/65">{item.category.description}</p>
        <button onClick={() => setShowCategory(false)} className="mt-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white">
          Mulai →
        </button>
      </div>
    );
  }

  function pick(o: SpektrumOption) {
    setPicks([...picks, o]);
    const nextIdx = idx + 1;
    const isLast = nextIdx >= flatOrder.length;
    const movingToNewCategory = !isLast && flatOrder[nextIdx].isFirstInCategory;
    setIdx(nextIdx);
    if (movingToNewCategory) setShowCategory(true);
  }

  const catProgress = byCategory.find((b) => b.category.id === item.category.id);
  const catQs = catProgress?.questions ?? [];
  const positionInCat = catQs.findIndex((q) => q.id === item.q.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">{item.category.emoji} {item.category.name}</span>
        <p className="text-xs text-ink/45">{positionInCat + 1} / {catQs.length}</p>
      </div>
      <div className="rounded-2xl border-2 border-sky-200 bg-white p-5 shadow-lg">
        <p className="text-base leading-relaxed text-ink">{item.q.text}</p>
      </div>
      <div className="flex flex-col gap-2">
        {item.q.options.map((o, i) => (
          <button key={i} onClick={() => pick(o)} className="rounded-2xl border border-sky-100 bg-white/70 p-4 text-left text-sm text-ink/80 transition-colors hover:border-sky-400 hover:bg-sky-50 active:scale-[0.98]">
            {o.text}
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-1 pt-2">
        {flatOrder.map((_, i) => (
          <div key={i} className={`h-1 w-3 rounded-full ${i < idx ? "bg-sky-400" : i === idx ? "bg-sky-200" : "bg-ink/10"}`} />
        ))}
      </div>
    </div>
  );
}
