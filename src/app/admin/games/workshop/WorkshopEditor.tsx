"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveWorkshopAction, deleteWorkshopAction } from "../actions";

type Row = {
  id: string; title: string; description: string;
  event_date: string | null; price_text: string;
  form_url: string | null; materi_url: string | null;
  posted_at: string; unposted_at: string; is_active: boolean;
};

function statusOf(r: Row): { label: string; color: string } {
  const now = Date.now();
  if (!r.is_active) return { label: "Nonaktif", color: "bg-ink/10 text-ink/50" };
  const post = new Date(r.posted_at).getTime();
  const unpost = new Date(r.unposted_at).getTime();
  if (now < post) return { label: "Draft (belum tayang)", color: "bg-slate-100 text-slate-700" };
  if (now > unpost) return { label: "Selesai (arsip)", color: "bg-ink/5 text-ink/45" };
  return { label: "Aktif — tayang", color: "bg-emerald-100 text-emerald-800" };
}

function fmt(d: string | null): string { return d ? d.slice(0, 16) : ""; } // for datetime-local

export function WorkshopEditor({ items }: { items: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "done">("all");
  const [err, setErr] = useState<string | null>(null);

  const filtered = items.filter((r) => {
    if (filter === "all") return true;
    const now = Date.now();
    const post = new Date(r.posted_at).getTime();
    const unpost = new Date(r.unposted_at).getTime();
    if (filter === "active") return r.is_active && now >= post && now <= unpost;
    if (filter === "draft") return r.is_active && now < post;
    if (filter === "done") return !r.is_active || now > unpost;
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {[
          { k: "all", label: "Semua" },
          { k: "active", label: "Aktif" },
          { k: "draft", label: "Draft" },
          { k: "done", label: "Arsip" },
        ].map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k as typeof filter)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${filter === f.k ? "bg-sky-500 text-white ring-sky-500" : "bg-white text-ink/60 ring-ink/15"}`}>{f.label}</button>
        ))}
      </div>

      {!adding && !editing && (
        <button onClick={() => setAdding(true)} className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white">+ Event baru</button>
      )}

      {(adding || editing) && (
        <Form
          row={editing}
          pending={pending}
          err={err}
          onCancel={() => { setAdding(false); setEditing(null); setErr(null); }}
          onSave={(d) => {
            setErr(null);
            startTransition(async () => {
              const r = await saveWorkshopAction(d);
              if (r.error) { setErr(r.error); return; }
              setAdding(false); setEditing(null); router.refresh();
            });
          }}
        />
      )}

      <ul className="flex flex-col gap-2">
        {filtered.map((it) => {
          const st = statusOf(it);
          return (
            <li key={it.id} className="rounded-xl bg-white p-3 ring-1 ring-ink/10">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-ink">{it.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink/55">
                    {it.event_date ? new Date(it.event_date).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Tanggal TBA"} · {it.price_text}
                  </p>
                  <p className="text-[11px] text-ink/45">Tayang: {new Date(it.posted_at).toLocaleDateString("id-ID")} → {new Date(it.unposted_at).toLocaleDateString("id-ID")}</p>
                </div>
                <button onClick={() => { setEditing(it); setAdding(false); }} className="text-xs text-sky-600 hover:underline">Edit</button>
                <button onClick={() => { if (confirm("Hapus event ini?")) startTransition(async () => { await deleteWorkshopAction(it.id); router.refresh(); }); }} className="text-xs text-rose-600 hover:underline">Hapus</button>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-xs italic text-ink/45">Kosong.</p>}
      </ul>
    </div>
  );
}

function Form({ row, onSave, onCancel, pending, err }: {
  row: Row | null;
  onSave: (d: Omit<Row, "id"> & { id?: string }) => void;
  onCancel: () => void; pending: boolean; err: string | null;
}) {
  const nowIso = new Date().toISOString().slice(0, 16);
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16);
  const [f, setF] = useState({
    title: row?.title ?? "",
    description: row?.description ?? "",
    event_date: fmt(row?.event_date ?? null),
    price_text: row?.price_text ?? "Gratis",
    form_url: row?.form_url ?? "",
    materi_url: row?.materi_url ?? "",
    posted_at: fmt(row?.posted_at ?? nowIso),
    unposted_at: fmt(row?.unposted_at ?? in14),
    is_active: row?.is_active ?? true,
  });
  const set = (k: string, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
      <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Judul event (mis. Workshop Kenal Diri)" className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-semibold" />
      <textarea value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Deskripsi event — apa yang akan dibahas, siapa yang cocok ikut, dll" rows={4} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">
          Tanggal & jam event
          <input type="datetime-local" value={f.event_date} onChange={(e) => set("event_date", e.target.value)} className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">
          Harga (teks bebas)
          <input value={f.price_text} onChange={(e) => set("price_text", e.target.value)} placeholder="Gratis / Rp 150.000 / Donasi" className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
        </label>
      </div>

      <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">
        Link Google Form (pendaftaran)
        <input value={f.form_url} onChange={(e) => set("form_url", e.target.value)} placeholder="https://forms.gle/..." className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">
        Link materi/rekaman (Google Drive) — diisi setelah event
        <input value={f.materi_url} onChange={(e) => set("materi_url", e.target.value)} placeholder="https://drive.google.com/..." className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">
          Mulai tayang banner
          <input type="datetime-local" value={f.posted_at} onChange={(e) => set("posted_at", e.target.value)} className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">
          Berhenti tayang banner
          <input type="datetime-local" value={f.unposted_at} onChange={(e) => set("unposted_at", e.target.value)} className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4" />
        {f.is_active ? "✅ Aktif" : "🔒 Nonaktif (banner tidak tayang walau dalam window)"}
      </label>

      {err && <p className="text-xs text-rose-700">⚠️ {err}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => onSave({
            id: row?.id,
            title: f.title,
            description: f.description,
            event_date: f.event_date ? new Date(f.event_date).toISOString() : null,
            price_text: f.price_text,
            form_url: f.form_url || null,
            materi_url: f.materi_url || null,
            posted_at: new Date(f.posted_at).toISOString(),
            unposted_at: new Date(f.unposted_at).toISOString(),
            is_active: f.is_active,
          })}
          disabled={pending || !f.title.trim() || !f.unposted_at}
          className="flex-1 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >{pending ? "Menyimpan..." : "💾 Simpan"}</button>
        <button onClick={onCancel} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink/70 ring-1 ring-ink/15">Batal</button>
      </div>
    </div>
  );
}
