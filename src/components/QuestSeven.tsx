"use client";

import { useState, useTransition } from "react";
import { QUEST_PROMPTS } from "@/core/lightContent";
import { saveQuestDayAction } from "@/app/main/actions";

export function QuestSeven({ initial }: { initial: Record<number, string> }) {
  const [entries, setEntries] = useState<Record<number, string>>(initial);
  const [open, setOpen] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function edit(day: number) {
    setOpen(day);
    setDraft(entries[day] ?? "");
    setError(null);
  }
  function save(day: number) {
    startTransition(async () => {
      const res = await saveQuestDayAction(day, draft);
      if (res.error) { setError(res.error); return; }
      setEntries((e) => ({ ...e, [day]: draft.trim() }));
      setOpen(null);
    });
  }

  const doneCount = Object.values(entries).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink/60">{doneCount}/7 hari kamu isi. Pelan-pelan aja, ga ada hukuman kalau bolong.</p>
      {QUEST_PROMPTS.map((p, idx) => {
        const day = idx + 1;
        const filled = !!entries[day];
        return (
          <div key={day} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Hari {day} {filled ? "✓" : ""}</p>
              <button type="button" onClick={() => edit(day)} className="text-xs font-medium text-sky-600">
                {filled ? "Ubah" : "Isi"}
              </button>
            </div>
            <p className="mt-1 text-sm text-ink/70">{p}</p>
            {filled && open !== day && (
              <p className="mt-2 rounded-xl bg-sky-50 p-3 text-sm italic text-ink/70">{entries[day]}</p>
            )}
            {open === day && (
              <div className="mt-2 flex flex-col gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => save(day)} disabled={pending}
                    className="rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
                    {pending ? "..." : "Simpan"}
                  </button>
                  <button type="button" onClick={() => setOpen(null)} className="rounded-full px-3 py-1.5 text-xs text-ink/50">Batal</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
