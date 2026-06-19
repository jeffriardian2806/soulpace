"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveGameResultAction } from "@/app/main/saveResult";

type PairOption = { label: string; image_url: string; traits: Record<string, number> };
type Item = { slug: string; prompt: string; option_a: PairOption; option_b: PairOption };
type Profile = { slug: string; name: string; emoji: string | null; description: string; dominant_traits: string[] };

type Pick = { itemSlug: string; chosen: "a" | "b"; traits: Record<string, number> };

export function VisualPairChoicePlayer({ items, profiles }: { items: Item[]; profiles: Profile[] }) {
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Pick[]>([]);
  const savedRef = useRef(false);

  // Compute aggregate traits
  const traits: Record<string, number> = {};
  picks.forEach((p) => {
    Object.entries(p.traits).forEach(([k, v]) => {
      traits[k] = (traits[k] ?? 0) + v;
    });
  });

  // Best matching profile
  function findBestProfile(): Profile | null {
    if (profiles.length === 0) return null;
    let best: Profile | null = null;
    let bestScore = -Infinity;
    profiles.forEach((p) => {
      const score = p.dominant_traits.reduce((sum, t) => sum + (traits[t] ?? 0), 0);
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    });
    return best;
  }

  const isDone = idx >= items.length;

  useEffect(() => {
    if (isDone && !savedRef.current) {
      savedRef.current = true;
      const profile = findBestProfile();
      saveGameResultAction("pilih-vibe", {
        title: "Pilih Vibe",
        headline: profile?.name ?? "Vibe profile",
        value: profile?.description ?? "",
        secondary: Object.entries(traits).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}:${v}`).join(" · "),
        emoji: profile?.emoji ?? "🎨",
      }, { picks, traits, profile_slug: profile?.slug });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone]);

  // Done — show vibe profile
  if (isDone) {
    const profile = findBestProfile();
    const sortedTraits = Object.entries(traits).sort((a, b) => b[1] - a[1]);
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-gradient-to-br from-purple-500 via-rose-400 to-amber-400 p-6 text-white shadow-xl">
          <p className="text-5xl">{profile?.emoji ?? "🎨"}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-white/80">Vibe profile kamu hari ini</p>
          <p className="mt-1 text-2xl font-bold">{profile?.name ?? "Balanced"}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/90">{profile?.description ?? "Hari ini vibe kamu agak fluid — fleksibel ke berbagai mood."}</p>
        </div>

        {sortedTraits.length > 0 && (
          <section className="glass rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wide text-ink/55">Trait yang dominan</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sortedTraits.slice(0, 5).map(([trait, score]) => (
                <span key={trait} className="rounded-full bg-gradient-to-r from-sky-100 to-purple-100 px-3 py-1 text-xs font-semibold text-ink/75 ring-1 ring-sky-200">
                  {trait} · {score}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="rounded-2xl bg-sky-50/50 p-4 ring-1 ring-sky-100">
          <p className="text-[10px] uppercase tracking-wide text-sky-700">💡 Catatan</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/65">
            Vibe profile = engagement reflection berdasarkan preferensi visual. <strong>Bukan personality test klinis</strong>. Bisa beda di hari lain.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setIdx(0); setPicks([]); savedRef.current = false; }}
            className="flex-1 rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white"
          >
            🔄 Coba lagi
          </button>
          <Link href="/main" className="flex-1 rounded-full bg-white px-4 py-3 text-center text-sm font-medium text-ink/70 ring-1 ring-sky-200">
            ← Kembali ke Main
          </Link>
        </div>
      </div>
    );
  }

  // Playing
  const item = items[idx];

  const handlePick = (which: "a" | "b") => {
    const opt = which === "a" ? item.option_a : item.option_b;
    setPicks([...picks, { itemSlug: item.slug, chosen: which, traits: opt.traits }]);
    setIdx(idx + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-ink/55">Pair {idx + 1} dari {items.length}</p>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full ${i < idx ? "bg-emerald-400" : i === idx ? "bg-purple-500" : "bg-ink/10"}`} />
          ))}
        </div>
      </div>

      <p className="text-sm font-semibold text-ink">{item.prompt}</p>

      <div className="grid grid-cols-2 gap-3">
        {(["a", "b"] as const).map((side) => {
          const opt = side === "a" ? item.option_a : item.option_b;
          return (
            <button
              key={side}
              onClick={() => handlePick(side)}
              className="group flex flex-col gap-2 rounded-2xl bg-white p-3 ring-1 ring-sky-200 transition-all hover:ring-purple-400 hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={opt.image_url} alt={opt.label} className="w-full h-auto" />
              </div>
              <p className="text-center text-xs font-semibold text-ink">{opt.label}</p>
            </button>
          );
        })}
      </div>

      <p className="text-center text-[10px] italic text-ink/45">
        Pilih spontan aja — yang langsung narik mata kamu.
      </p>
    </div>
  );
}
