"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAuraMoodAction, deleteAuraMoodAction } from "../actions";

type Row = {
  id: string; mood_key: string; emoji: string; label: string; color: string; glow: string;
  particle: string; desc_short: string; desc_mystic: string; sort_order: number; is_active: boolean;
};
const PARTICLES = ["sparkle", "fire", "bubble", "rain", "leaf", "star", "mist", "spark"];

export function AuraMoodEditor({ items }: { items: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-lg bg-sky-50 p-2 text-[11px] text-sky-800 ring-1 ring-sky-200">
        <b>mood_key</b> harus sama persis dengan yang dideteksi kode (happy, joyful, neutral, sad, angry, surprised, fear, disgust, tired, focused). Kalau bikin key baru, kode belum tentu ngeluarin key itu. Yang aman diedit: emoji, label, warna, partikel, deskripsi.
      </p>

      {!adding && !editing && (
        <button onClick={() => setAdding(true)} className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white">+ Tambah aura</button>
      )}

      {(adding || editing) && (
        <Form
          row={editing}
          pending={pending}
          err={err}
          onCancel={() => { setAdding(false); setEditing(null); setErr(null); }}
          onSave={(data) => {
            setErr(null);
            startTransition(async () => {
              const r = await saveAuraMoodAction(data);
              if (r.error) { setErr(r.error); return; }
              setAdding(false); setEditing(null); router.refresh();
            });
          }}
        />
      )}

      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.id} className={`rounded-xl p-3 ring-1 ${it.is_active ? "bg-white ring-ink/10" : "bg-ink/5 opacity-70 ring-ink/5"}`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg text-xl" style={{ background: it.glow }}>{it.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink">{it.label} <span className="font-mono text-[10px] text-ink/40">({it.mood_key})</span></p>
                <p className="truncate text-xs text-ink/55">{it.particle} · {it.desc_short}</p>
              </div>
              <button onClick={() => { setEditing(it); setAdding(false); }} className="text-xs text-sky-600 hover:underline">Edit</button>
              <button onClick={() => { if (confirm("Hapus?")) startTransition(async () => { await deleteAuraMoodAction(it.id); router.refresh(); }); }} className="text-xs text-rose-600 hover:underline">Hapus</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Form({ row, onSave, onCancel, pending, err }: {
  row: Row | null;
  onSave: (d: Omit<Row, "id"> & { id?: string }) => void;
  onCancel: () => void; pending: boolean; err: string | null;
}) {
  const [f, setF] = useState({
    mood_key: row?.mood_key ?? "", emoji: row?.emoji ?? "✨", label: row?.label ?? "",
    color: row?.color ?? "#60A5FA", glow: row?.glow ?? "#A5C8FF", particle: row?.particle ?? "sparkle",
    desc_short: row?.desc_short ?? "", desc_mystic: row?.desc_mystic ?? "",
    sort_order: row?.sort_order ?? 99, is_active: row?.is_active ?? true,
  });
  const set = (k: string, v: string | number | boolean) => setF((s) => ({ ...s, [k]: v }));

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
      <div className="flex gap-2">
        <input value={f.emoji} onChange={(e) => set("emoji", e.target.value)} className="w-16 rounded-lg border border-ink/15 px-2 py-2 text-center text-lg" maxLength={4} />
        <input value={f.label} onChange={(e) => set("label", e.target.value)} placeholder="Nama aura (Biru Laut)" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      </div>
      <input value={f.mood_key} onChange={(e) => set("mood_key", e.target.value)} placeholder="mood_key (happy, sad, dll)" className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-mono" />
      <div className="flex gap-2">
        <label className="flex flex-1 items-center gap-2 text-xs text-ink/60">Warna<input type="color" value={f.color} onChange={(e) => set("color", e.target.value)} className="h-9 w-full rounded" /></label>
        <label className="flex flex-1 items-center gap-2 text-xs text-ink/60">Glow<input type="color" value={f.glow} onChange={(e) => set("glow", e.target.value)} className="h-9 w-full rounded" /></label>
      </div>
      <select value={f.particle} onChange={(e) => set("particle", e.target.value)} className="rounded-lg border border-ink/15 px-2 py-2 text-sm">
        {PARTICLES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <input value={f.desc_short} onChange={(e) => set("desc_short", e.target.value)} placeholder="Deskripsi singkat" className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <textarea value={f.desc_mystic} onChange={(e) => set("desc_mystic", e.target.value)} placeholder="Teks mistis / ramalan" rows={3} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-sm text-ink/70"><input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4" /> {f.is_active ? "✅ Aktif" : "🔒 Nonaktif"}</label>
      {err && <p className="text-xs text-rose-700">⚠️ {err}</p>}
      <div className="flex gap-2">
        <button onClick={() => onSave({ id: row?.id, ...f })} disabled={pending || !f.label.trim() || !f.mood_key.trim()} className="flex-1 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Menyimpan..." : "💾 Simpan"}</button>
        <button onClick={onCancel} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink/70 ring-1 ring-ink/15">Batal</button>
      </div>
    </div>
  );
}
