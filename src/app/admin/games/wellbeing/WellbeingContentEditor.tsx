"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveWellbeingContentAction, deleteWellbeingContentAction } from "../actions";

type Row = { id: string; kind: string; content_key: string; emoji: string | null; title: string | null; body: string | null; extra: Record<string, unknown> | null; sort_order: number; is_active: boolean };

const KINDS = [
  { k: "breath_pattern", label: "Pola Napas", hint: "extra JSON: {inhale, hold, exhale, holdOut, cycles} — semua dalam detik" },
  { k: "focus_message", label: "Kalimat Fokus", hint: "Kalimat mindfulness pas user fokus tiap 15 detik" },
  { k: "bubble_label", label: "Label Emosi Bubble", hint: "Label default emosi di Bubble Pop (isi body = teks label)" },
  { k: "balloon_word", label: "Kata Affirmasi", hint: "Kata pendek di balon (Memory Hunt & Butterfly)" },
];

export function WellbeingContentEditor({ items }: { items: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("breath_pattern");
  const [editing, setEditing] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const filtered = items.filter((i) => i.kind === filter);
  const activeKind = KINDS.find((k) => k.k === filter);

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-lg bg-sky-50 p-2 text-[11px] leading-relaxed text-sky-800 ring-1 ring-sky-200">
        Semua konten dinamis — Rey bebas ubah/tambah sesuai fakta lapangan & update ilmu psikologi.
      </p>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {KINDS.map((k) => (
          <button key={k.k} onClick={() => { setFilter(k.k); setEditing(null); setAdding(false); }} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${filter === k.k ? "bg-sky-500 text-white ring-sky-500" : "bg-white text-ink/60 ring-ink/15"}`}>{k.label}</button>
        ))}
      </div>

      {activeKind && <p className="text-[11px] italic text-ink/50">{activeKind.hint}</p>}

      {!adding && !editing && (
        <button onClick={() => setAdding(true)} className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white">+ Tambah</button>
      )}

      {(adding || editing) && (
        <Form
          row={editing} kind={filter} pending={pending} err={err}
          onCancel={() => { setAdding(false); setEditing(null); setErr(null); }}
          onSave={(d) => {
            setErr(null);
            startTransition(async () => {
              const r = await saveWellbeingContentAction(d);
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
                <p className="text-sm font-bold text-ink">{it.title ?? it.content_key} <span className="font-mono text-[10px] text-ink/40">({it.content_key})</span></p>
                {it.body && <p className="text-xs text-ink/60">{it.body}</p>}
                {it.extra && <p className="text-[10px] font-mono text-ink/45">{JSON.stringify(it.extra)}</p>}
              </div>
              <button onClick={() => { setEditing(it); setAdding(false); }} className="text-xs text-sky-600 hover:underline">Edit</button>
              <button onClick={() => { if (confirm("Hapus?")) startTransition(async () => { await deleteWellbeingContentAction(it.id); router.refresh(); }); }} className="text-xs text-rose-600 hover:underline">Hapus</button>
            </div>
          </li>
        ))}
        {filtered.length === 0 && <p className="text-center text-xs italic text-ink/45">Kosong.</p>}
      </ul>
    </div>
  );
}

function Form({ row, kind, onSave, onCancel, pending, err }: {
  row: Row | null; kind: string;
  onSave: (d: { id?: string; kind: string; content_key: string; emoji: string; title: string; body: string; extra_json: string; sort_order: number; is_active: boolean }) => void;
  onCancel: () => void; pending: boolean; err: string | null;
}) {
  const [f, setF] = useState({
    content_key: row?.content_key ?? "",
    emoji: row?.emoji ?? "",
    title: row?.title ?? "",
    body: row?.body ?? "",
    extra_json: row?.extra ? JSON.stringify(row.extra) : "",
    sort_order: row?.sort_order ?? 99,
    is_active: row?.is_active ?? true,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
      <p className="text-xs font-bold uppercase text-sky-700">{row ? "Edit" : "Baru"} · {kind}</p>
      <div className="flex gap-2">
        <input value={f.emoji} onChange={(e) => set("emoji", e.target.value)} maxLength={4} className="w-14 rounded-lg border border-ink/15 px-2 py-2 text-center text-lg" />
        <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Judul (opsional)" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      </div>
      <input value={f.content_key} onChange={(e) => set("content_key", e.target.value)} placeholder="content_key" className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-mono" />
      <textarea value={f.body} onChange={(e) => set("body", e.target.value)} placeholder="Isi / kalimat" rows={3} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      {kind === "breath_pattern" && (
        <textarea value={f.extra_json} onChange={(e) => set("extra_json", e.target.value)} placeholder='{"inhale":4,"hold":7,"exhale":8,"holdOut":0,"cycles":4}' rows={2} className="rounded-lg border border-ink/15 px-3 py-2 font-mono text-xs" />
      )}
      <div className="flex gap-2">
        <input type="number" value={f.sort_order} onChange={(e) => set("sort_order", +e.target.value)} className="w-24 rounded-lg border border-ink/15 px-2 py-1.5 text-xs" placeholder="urutan" />
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4" /> {f.is_active ? "Aktif" : "Nonaktif"}
        </label>
      </div>
      {err && <p className="text-xs text-rose-700">⚠️ {err}</p>}
      <div className="flex gap-2">
        <button onClick={() => onSave({ id: row?.id, kind, ...f })} disabled={pending || !f.content_key.trim()} className="flex-1 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Menyimpan..." : "💾 Simpan"}
        </button>
        <button onClick={onCancel} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink/70 ring-1 ring-ink/15">Batal</button>
      </div>
    </div>
  );
}
