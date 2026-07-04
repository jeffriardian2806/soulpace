"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveScanContentAction, deleteScanContentAction } from "../actions";

type Row = { id: string; mode: string; content_key: string; emoji: string | null; title: string; body: string; sort_order: number; is_active: boolean };
const MODES = ["persona", "karakter", "love", "umur", "masadepan", "batin", "bohong", "ramalan"];

export function ScanContentEditor({ items }: { items: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("persona");
  const [editing, setEditing] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const filtered = items.filter((i) => i.mode === filter);

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-lg bg-sky-50 p-2 text-[11px] text-sky-800 ring-1 ring-sky-200">
        <b>content_key</b> nyambung ke logika kode — jangan diubah buat yang bawaan. Aman diedit: emoji, title, body (copy). Placeholder kayak {"{umur} {aura} {arah} {saran} {n}"} jangan dihapus (diisi otomatis).
      </p>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {MODES.map((m) => (
          <button key={m} onClick={() => { setFilter(m); setEditing(null); setAdding(false); }} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${filter === m ? "bg-sky-500 text-white ring-sky-500" : "bg-white text-ink/60 ring-ink/15"}`}>{m}</button>
        ))}
      </div>

      {!adding && !editing && (
        <button onClick={() => setAdding(true)} className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white">+ Tambah konten ({filter})</button>
      )}

      {(adding || editing) && (
        <Form
          row={editing} mode={filter} pending={pending} err={err}
          onCancel={() => { setAdding(false); setEditing(null); setErr(null); }}
          onSave={(d) => {
            setErr(null);
            startTransition(async () => {
              const r = await saveScanContentAction(d);
              if (r.error) { setErr(r.error); return; }
              setAdding(false); setEditing(null); router.refresh();
            });
          }}
        />
      )}

      <ul className="flex flex-col gap-2">
        {filtered.map((it) => (
          <li key={it.id} className={`rounded-xl p-3 ring-1 ${it.is_active ? "bg-white ring-ink/10" : "bg-ink/5 opacity-70 ring-ink/5"}`}>
            <div className="flex items-start gap-2">
              <span className="text-xl">{it.emoji ?? "•"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink">{it.title} <span className="font-mono text-[10px] text-ink/40">({it.content_key})</span></p>
                <p className="text-xs leading-relaxed text-ink/60">{it.body}</p>
              </div>
              <button onClick={() => { setEditing(it); setAdding(false); }} className="text-xs text-sky-600 hover:underline">Edit</button>
              <button onClick={() => { if (confirm("Hapus?")) startTransition(async () => { await deleteScanContentAction(it.id); router.refresh(); }); }} className="text-xs text-rose-600 hover:underline">Hapus</button>
            </div>
          </li>
        ))}
        {filtered.length === 0 && <p className="text-center text-xs italic text-ink/45">Kosong.</p>}
      </ul>
    </div>
  );
}

function Form({ row, mode, onSave, onCancel, pending, err }: {
  row: Row | null; mode: string;
  onSave: (d: { id?: string; mode: string; content_key: string; emoji: string; title: string; body: string; sort_order: number; is_active: boolean }) => void;
  onCancel: () => void; pending: boolean; err: string | null;
}) {
  const [f, setF] = useState({
    content_key: row?.content_key ?? "", emoji: row?.emoji ?? "✨", title: row?.title ?? "",
    body: row?.body ?? "", sort_order: row?.sort_order ?? 99, is_active: row?.is_active ?? true,
  });
  const set = (k: string, v: string | number | boolean) => setF((s) => ({ ...s, [k]: v }));

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
      <p className="text-xs font-bold uppercase text-sky-700">{row ? "Edit" : "Baru"} · mode: {mode}</p>
      <div className="flex gap-2">
        <input value={f.emoji} onChange={(e) => set("emoji", e.target.value)} className="w-16 rounded-lg border border-ink/15 px-2 py-2 text-center text-lg" maxLength={4} />
        <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Judul" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      </div>
      <input value={f.content_key} onChange={(e) => set("content_key", e.target.value)} placeholder="content_key (teknis)" className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-mono" />
      <textarea value={f.body} onChange={(e) => set("body", e.target.value)} placeholder="Isi / kalimat" rows={3} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-sm text-ink/70"><input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4" /> {f.is_active ? "✅ Aktif" : "🔒 Nonaktif"}</label>
      {err && <p className="text-xs text-rose-700">⚠️ {err}</p>}
      <div className="flex gap-2">
        <button onClick={() => onSave({ id: row?.id, mode, ...f })} disabled={pending || !f.title.trim() || !f.content_key.trim()} className="flex-1 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Menyimpan..." : "💾 Simpan"}</button>
        <button onClick={onCancel} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink/70 ring-1 ring-ink/15">Batal</button>
      </div>
    </div>
  );
}
