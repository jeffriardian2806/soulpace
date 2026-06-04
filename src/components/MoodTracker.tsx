"use client";

import { useState, useMemo, useTransition } from "react";
import { saveMoodAction } from "@/app/mood/actions";

type Entry = { date: string; mood: number; note: string | null };

const MOODS = [
  { v: 5, emoji: "😄", label: "Sangat Baik", dot: "bg-emerald-400" },
  { v: 4, emoji: "🙂", label: "Baik", dot: "bg-sky-400" },
  { v: 3, emoji: "😐", label: "Biasa", dot: "bg-slate-300" },
  { v: 2, emoji: "😔", label: "Sedih", dot: "bg-indigo-300" },
  { v: 1, emoji: "😫", label: "Sangat Berat", dot: "bg-rose-400" },
];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function MoodTracker({ initialEntries }: { initialEntries: Entry[] }) {
  const today = ymd(new Date());
  const [map, setMap] = useState<Record<string, Entry>>(() =>
    Object.fromEntries(initialEntries.map((e) => [e.date, e]))
  );
  const [selected, setSelected] = useState<number | null>(
    map[today]?.mood ?? null
  );
  const [note, setNote] = useState<string>(map[today]?.note ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const days = useMemo(() => {
    const arr: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(ymd(d));
    }
    return arr;
  }, []);

  function save() {
    if (selected == null) return;
    setSaved(false);
    startTransition(async () => {
      const res = await saveMoodAction(today, selected, note);
      if (res.ok) {
        setMap((m) => ({
          ...m,
          [today]: { date: today, mood: selected, note: note || null },
        }));
        setSaved(true);
      }
    });
  }

  return (
    <div className="space-y-5">
      <section className="glass rounded-2xl p-4">
        <h2 className="text-sm font-bold text-ink">Gimana perasaanmu hari ini?</h2>
        <div className="mt-3 flex justify-between gap-1">
          {MOODS.map((m) => (
            <button
              key={m.v}
              type="button"
              onClick={() => setSelected(m.v)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-colors ${
                selected === m.v ? "bg-sky-100" : "hover:bg-sky-50"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] leading-tight text-ink/60">{m.label}</span>
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Mau nambah catatan? (opsional)"
          rows={2}
          maxLength={500}
          className="mt-3 w-full rounded-xl border border-ink/10 bg-white/60 p-2 text-sm text-ink outline-none focus:border-sky-300"
        />
        <button
          type="button"
          onClick={save}
          disabled={selected == null || pending}
          className="mt-3 w-full rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : map[today] ? "Perbarui mood hari ini" : "Simpan mood"}
        </button>
        {saved && (
          <p className="mt-2 text-center text-xs text-emerald-600">Tersimpan untuk hari ini.</p>
        )}
      </section>

      <section className="glass rounded-2xl p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">30 hari terakhir</h2>
        <div className="grid grid-cols-10 gap-1.5">
          {days.map((d) => {
            const mood = map[d]?.mood;
            const dot = MOODS.find((m) => m.v === mood)?.dot ?? "bg-slate-100";
            return (
              <div
                key={d}
                title={d}
                className={`aspect-square rounded-md ${dot} ${
                  d === today ? "ring-2 ring-sky-400" : ""
                }`}
              />
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {MOODS.map((m) => (
            <span key={m.v} className="flex items-center gap-1 text-[10px] text-ink/55">
              <span className={`h-2.5 w-2.5 rounded-sm ${m.dot}`} /> {m.label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
