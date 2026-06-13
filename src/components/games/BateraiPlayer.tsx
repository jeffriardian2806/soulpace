"use client";
import { useState } from "react";

export type BatteryAction = {
  id: string;
  emoji: string;
  label: string;
  description: string;
  social_delta: number;
  energy_delta: number;
  productivity_delta: number;
};

const DAYS = 7;

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const clamp = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[10px] text-ink/55">
        <span>{label}</span>
        <span className="tabular-nums">{clamp}</span>
      </div>
      <div className="h-2 rounded-full bg-ink/5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clamp}%`, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

export function BateraiPlayer({ actions }: { actions: BatteryAction[] }) {
  const [day, setDay] = useState(1);
  const [social, setSocial] = useState(60);
  const [energy, setEnergy] = useState(60);
  const [prod, setProd] = useState(40);
  const [history, setHistory] = useState<string[]>([]);

  if (actions.length === 0) return <p className="text-sm text-ink/50">Aktivitas belum tersedia.</p>;

  const done = day > DAYS;
  if (done) {
    const avg = Math.round((social + energy + prod) / 3);
    const verdict =
      social < 20 ? "Kamu kelelahan secara sosial. Minggu depan, kurangi 1 social commitment dan tambah 1 me-time." :
      energy < 20 ? "Energi kamu kehabisan. Tidur jadi prioritas, kurangi push pekerjaan." :
      prod < 20 ? "Productivity rendah. Tapi itu bukan musuh — mungkin kamu lagi butuh recovery dulu." :
      avg >= 50 ? "Balance kamu cukup sehat minggu ini. Pertahankan pola yang jalan." :
      "Semua aspek lagi tengah-tengah. Coba pilih 1 yang paling penting buat ditingkatin minggu depan.";

    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-purple-500 p-6 text-center text-white">
          <p className="text-4xl">📊</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-white/70">Akhir minggu</p>
          <p className="mt-3 text-sm leading-relaxed">{verdict}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-4">
          <Bar label="🔋 Energi sosial" value={social} color="bg-rose-400" />
          <div className="h-2" />
          <Bar label="⚡ Energi fisik" value={energy} color="bg-amber-400" />
          <div className="h-2" />
          <Bar label="🎯 Produktivitas" value={prod} color="bg-emerald-400" />
        </div>
        <details className="rounded-2xl bg-white/60 p-3 text-xs text-ink/65">
          <summary className="cursor-pointer font-medium">Apa yang lo lakuin minggu ini</summary>
          <ul className="mt-2 flex flex-col gap-1">{history.map((h, i) => <li key={i}>Hari {i + 1}: {h}</li>)}</ul>
        </details>
        <button onClick={() => { setDay(1); setSocial(60); setEnergy(60); setProd(40); setHistory([]); }} className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white">Main lagi</button>
      </div>
    );
  }

  function pick(a: BatteryAction) {
    setSocial((s) => Math.max(0, Math.min(100, s + a.social_delta)));
    setEnergy((e) => Math.max(0, Math.min(100, e + a.energy_delta)));
    setProd((p) => Math.max(0, Math.min(100, p + a.productivity_delta)));
    setHistory([...history, `${a.emoji} ${a.label}`]);
    setDay(day + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white/70 p-3">
        <p className="mb-2 text-xs font-semibold text-ink/55">Hari {day} / {DAYS}</p>
        <Bar label="🔋 Energi sosial" value={social} color="bg-rose-400" />
        <div className="h-1.5" />
        <Bar label="⚡ Energi fisik" value={energy} color="bg-amber-400" />
        <div className="h-1.5" />
        <Bar label="🎯 Produktivitas" value={prod} color="bg-emerald-400" />
      </div>
      <p className="text-sm font-medium text-ink">Hari ini lo mau ngapain?</p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button key={a.id} onClick={() => pick(a)} className="flex flex-col items-start gap-1 rounded-2xl border border-sky-100 bg-white/70 p-3 text-left transition-colors hover:border-sky-400 hover:bg-sky-50 active:scale-[0.98]">
            <span className="text-xl">{a.emoji}</span>
            <p className="text-xs font-semibold text-ink">{a.label}</p>
            <p className="text-[10px] leading-snug text-ink/55">{a.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
