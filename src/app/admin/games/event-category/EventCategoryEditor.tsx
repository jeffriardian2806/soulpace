"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveEventCategoryAction, deleteEventCategoryAction } from "../actions";

type Row = { id: string; label: string; emoji: string | null; sort_order: number; is_active: boolean };

export function EventCategoryEditor({ items }: { items: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-lg bg-sky-50 p-2 text-[11px] leading-relaxed text-sky-800 ring-1 ring-sky-200">
        Kategori ini yang bakal muncul di dropdown saat bikin Event, dan tampil di banner publik. Bebas tambah/edit — mis. "Workshop", "Training", "Pelatihan", "Seminar", "Kelas Malam", dll.
      </p>

      {!adding && !editing && (
        <button onClick={() => setAdding(true)} className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white">+ Kategori baru</button>
      )}

      {(adding || editing) && (
        <Form row={editing} pending={pending} err={err}
          onCancel={() => { setAdding(false); setEditing(null); setErr(null); }}
          onSave={(d) => {
            setErr(null);
            startTransition(async () => {
              const r = await saveEventCategoryAction(d);
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
              <span className="text-xl">{it.emoji ?? "🎉"}</span>
              <p className="flex-1 text-sm font-bold text-ink">{it.label}</p>
              <span className="text-[10px] text-ink/40">urut: {it.sort_order}</span>
              <button onClick={() => { setEditing(it); setAdding(false); }} className="text-xs text-sky-600 hover:underline">Edit</button>
              <button onClick={() => { if (confirm("Hapus kategori? Event yang pakai kategori ini jadi tanpa kategori.")) startTransition(async () => { await deleteEventCategoryAction(it.id); router.refresh(); }); }} className="text-xs text-rose-600 hover:underline">Hapus</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Form({ row, onSave, onCancel, pending, err }: {
  row: Row | null;
  onSave: (d: { id?: string; label: string; emoji: string; sort_order: number; is_active: boolean }) => void;
  onCancel: () => void; pending: boolean; err: string | null;
}) {
  const [f, setF] = useState({ label: row?.label ?? "", emoji: row?.emoji ?? "🎉", sort_order: row?.sort_order ?? 99, is_active: row?.is_active ?? true });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
      <div className="flex gap-2">
        <input value={f.emoji} onChange={(e) => set("emoji", e.target.value)} maxLength={4} className="w-16 rounded-lg border border-ink/15 px-2 py-2 text-center text-lg" />
        <input value={f.label} onChange={(e) => set("label", e.target.value)} placeholder="Nama kategori (Workshop, Training, dll)" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-0.5 text-[11px] text-ink/60">Urutan
          <input type="number" value={f.sort_order} onChange={(e) => set("sort_order", +e.target.value)} className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
        </label>
        <label className="flex items-center gap-2 pt-3.5 text-sm text-ink/70">
          <input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4" />
          {f.is_active ? "Aktif" : "Nonaktif"}
        </label>
      </div>
      {err && <p className="text-xs text-rose-700">⚠️ {err}</p>}
      <div className="flex gap-2">
        <button onClick={() => onSave({ id: row?.id, ...f })} disabled={pending || !f.label.trim()} className="flex-1 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Menyimpan..." : "💾 Simpan"}
        </button>
        <button onClick={onCancel} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink/70 ring-1 ring-ink/15">Batal</button>
      </div>
    </div>
  );
}
