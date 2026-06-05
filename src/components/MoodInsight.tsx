"use client";

import { useMemo } from "react";

type Entry = { date: string; mood: number };

const MOOD_BG: Record<number, string> = {
  5: "bg-emerald-400",
  4: "bg-sky-400",
  3: "bg-slate-300",
  2: "bg-indigo-300",
  1: "bg-rose-400",
};
const MOOD_LABEL: Record<number, string> = {
  5: "Sangat Baik",
  4: "Baik",
  3: "Biasa",
  2: "Sedih",
  1: "Sangat Berat",
};
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const WEEKS = 12;

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function MoodInsight({ entries }: { entries: Entry[] }) {
  const map = useMemo(
    () => Object.fromEntries(entries.map((e) => [e.date, e.mood])),
    [entries]
  );

  // Heatmap: 12 minggu terakhir, align ke minggu (Minggu di baris atas)
  const cells = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (WEEKS * 7 - 1));
    const pad = start.getDay();
    const arr: ({ date: string; mood: number | null } | null)[] = [];
    for (let i = 0; i < pad; i++) arr.push(null);
    const cur = new Date(start);
    while (cur <= today) {
      const key = ymd(cur);
      arr.push({ date: key, mood: (map[key] as number) ?? null });
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, [map]);

  // Statistik 30 hari terakhir
  const last30 = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const vals: number[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const m = map[ymd(d)] as number | undefined;
      if (m != null) vals.push(m);
    }
    return vals;
  }, [map]);

  const avg = last30.length ? last30.reduce((a, b) => a + b, 0) / last30.length : null;

  // Pola per hari (semua entri yang ada)
  const weekday = useMemo(() => {
    const sum = Array(7).fill(0);
    const cnt = Array(7).fill(0);
    for (const e of entries) {
      const wd = new Date(e.date + "T00:00:00").getDay();
      sum[wd] += e.mood;
      cnt[wd] += 1;
    }
    let lo = -1;
    let hi = -1;
    let loV = Infinity;
    let hiV = -Infinity;
    for (let i = 0; i < 7; i++) {
      if (cnt[i] === 0) continue;
      const a = sum[i] / cnt[i];
      if (a < loV) {
        loV = a;
        lo = i;
      }
      if (a > hiV) {
        hiV = a;
        hi = i;
      }
    }
    return { lo, hi, enough: entries.length >= 7 };
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold text-ink">Pola &amp; Heatmap</h2>

      <div className="grid grid-cols-2 gap-2">
        <div className="glass rounded-xl p-3">
          <p className="text-xs text-ink/45">Rata-rata 30 hari</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {avg != null
              ? `${avg.toFixed(1)}/5 · ${MOOD_LABEL[Math.round(avg)]}`
              : "Belum ada data"}
          </p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-xs text-ink/45">Hari tercatat (30 hari)</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">{last30.length} hari</p>
        </div>
      </div>

      {weekday.enough && weekday.lo >= 0 && (
        <p className="text-xs leading-relaxed text-ink/55">
          Kamu cenderung lebih berat di hari{" "}
          <b className="text-ink/80">{HARI[weekday.lo]}</b>
          {weekday.hi >= 0 && weekday.hi !== weekday.lo && (
            <>
              {" "}
              dan paling cerah di <b className="text-ink/80">{HARI[weekday.hi]}</b>
            </>
          )}
          .
        </p>
      )}

      <div>
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {cells.map((c, i) => (
            <div
              key={i}
              title={c ? `${c.date}${c.mood ? " · " + MOOD_LABEL[c.mood] : ""}` : ""}
              className={`h-3.5 w-3.5 rounded-sm ${
                c == null ? "bg-transparent" : c.mood ? MOOD_BG[c.mood] : "bg-ink/5"
              }`}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink/45">
          {[1, 2, 3, 4, 5].map((m) => (
            <span key={m} className="flex items-center gap-1">
              <span className={`h-2.5 w-2.5 rounded-sm ${MOOD_BG[m]}`} />
              {MOOD_LABEL[m]}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
