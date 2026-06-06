"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { toggleStoryReactionAction } from "@/app/cerita/actions";

const KINDS: { kind: string; label: string; emoji: string }[] = [
  { kind: "pernah", label: "Aku pernah", emoji: "🫂" },
  { kind: "sedang", label: "Aku lagi di fase ini", emoji: "🌊" },
  { kind: "lewat", label: "Aku udah lewat ini", emoji: "🌅" },
  { kind: "belajar", label: "Aku belajar sesuatu", emoji: "💡" },
];

export function StoryReactions({ storyId }: { storyId: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    (async () => {
      const { data: cnt } = await supabase.rpc("story_reaction_counts", { p_story_id: storyId });
      const { data: { user } } = await supabase.auth.getUser();
      let mineSet = new Set<string>();
      if (user) {
        const { data: rows } = await supabase
          .from("story_reactions")
          .select("kind")
          .eq("story_id", storyId)
          .eq("user_id", user.id);
        mineSet = new Set((rows ?? []).map((r: { kind: string }) => r.kind));
      }
      if (active) {
        setCounts((cnt as Record<string, number>) ?? {});
        setMine(mineSet);
      }
    })();
    return () => { active = false; };
  }, [storyId]);

  function toggle(kind: string) {
    const was = mine.has(kind);
    setMine((p) => {
      const n = new Set(p);
      if (was) n.delete(kind); else n.add(kind);
      return n;
    });
    setCounts((c) => ({ ...c, [kind]: Math.max(0, (c[kind] ?? 0) + (was ? -1 : 1)) }));
    startTransition(() => { void toggleStoryReactionAction(storyId, kind, was); });
  }

  return (
    <section className="rounded-2xl border border-sky-100 bg-white/60 p-4">
      <p className="mb-3 text-sm font-semibold text-ink">Kamu merasa gimana sama cerita ini?</p>
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => {
          const on = mine.has(k.kind);
          const c = counts[k.kind] ?? 0;
          return (
            <button
              key={k.kind}
              type="button"
              onClick={() => toggle(k.kind)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                on ? "bg-sky-500 text-white" : "bg-white/70 text-ink/70 hover:bg-sky-50"
              }`}
            >
              <span className="leading-none">{k.emoji}</span>
              {k.label}
              {c > 0 && <span className={on ? "text-white/80" : "text-ink/40"}>· {c}</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink/40">Sinyal kecil buat penulis kalau dia nggak sendirian.</p>
    </section>
  );
}
