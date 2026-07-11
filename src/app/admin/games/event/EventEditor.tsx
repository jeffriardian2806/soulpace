"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveEventAction, deleteEventAction, saveEventCategoryAction, deleteEventCategoryAction } from "../actions";

type Category = { id: string; label: string; emoji: string | null; sort_order: number; is_active: boolean };
type Row = {
  id: string; category_id: string | null; category_label: string | null; category_emoji: string | null;
  title: string; description: string; event_date: string | null; price_text: string;
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
const fmt = (d: string | null) => d ? d.slice(0, 16) : "";

export function EventEditor({ items, categories }: { items: Row[]; categories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "done">("all");
  const [err, setErr] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState(false);

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
      {/* KATEGORI — collapse di atas */}
      <details open={catOpen} onToggle={(e) => setCatOpen((e.target as HTMLDetailsElement).open)} className="rounded-2xl bg-white p-3 ring-1 ring-ink/10">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-ink">🏷️ Kategori Event <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">{categories.length}</span></p>
              <p className="text-[11px] text-ink/55">Pilihan buat dropdown saat bikin event (mis. Workshop, Training, Pelatihan). Bebas tambah/edit.</p>
            </div>
            <span className="text-ink/40">{catOpen ? "▴" : "▾"}</span>
          </div>
        </summary>
        <div className="mt-3">
          <CategoryManager categories={categories} />
        </div>
      </details>

      {/* FILTER + ADD */}
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
        <EventForm
          row={editing} categories={categories} pending={pending} err={err}
          onCancel={() => { setAdding(false); setEditing(null); setErr(null); }}
          onSave={(d) => {
            setErr(null);
            startTransition(async () => {
              const r = await saveEventAction(d);
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
                    {it.category_label && <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700 ring-1 ring-orange-200">{it.category_emoji ?? "🎉"} {it.category_label}</span>}
                    <p className="text-sm font-bold text-ink">{it.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink/55">
                    {it.event_date ? new Date(it.event_date).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Tanggal TBA"} · {it.price_text}
                  </p>
                  <p className="text-[11px] text-ink/45">Tayang: {new Date(it.posted_at).toLocaleDateString("id-ID")} → {new Date(it.unposted_at).toLocaleDateString("id-ID")}</p>
                </div>
                <button onClick={() => { setEditing(it); setAdding(false); }} className="text-xs text-sky-600 hover:underline">Edit</button>
                <button onClick={() => { if (confirm("Hapus event ini?")) startTransition(async () => { await deleteEventAction(it.id); router.refresh(); }); }} className="text-xs text-rose-600 hover:underline">Hapus</button>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-xs italic text-ink/45">Kosong.</p>}
      </ul>
    </div>
  );
}

// ==== Category manager inline (chips + add + edit + delete) ====
function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-800 ring-1 ring-orange-200">
            <span>{c.emoji ?? "🎉"}</span>
            <span>{c.label}</span>
            <button onClick={() => setEditingId(editingId === c.id ? null : c.id)} className="ml-1 text-ink/40 hover:text-sky-600" title="Edit">✏️</button>
            <button
              onClick={() => { if (confirm(`Hapus kategori "${c.label}"? Event yang pakai kategori ini jadi tanpa kategori.`)) start(async () => { await deleteEventCategoryAction(c.id); router.refresh(); }); }}
              className="text-ink/40 hover:text-rose-600" title="Hapus"
            >🗑️</button>
          </div>
        ))}
        {!adding && !editingId && (
          <button onClick={() => setAdding(true)} className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">+ Tambah kategori</button>
        )}
      </div>

      {adding && (
        <CategoryInlineForm
          onCancel={() => setAdding(false)}
          onDone={() => { setAdding(false); router.refresh(); }}
          nextSort={categories.length + 1}
          pending={pending}
          start={start}
        />
      )}
      {editingId && (
        <CategoryInlineForm
          row={categories.find((c) => c.id === editingId) ?? null}
          onCancel={() => setEditingId(null)}
          onDone={() => { setEditingId(null); router.refresh(); }}
          nextSort={0}
          pending={pending}
          start={start}
        />
      )}
    </div>
  );
}

function CategoryInlineForm({ row, onCancel, onDone, nextSort, pending, start }: {
  row?: Category | null; onCancel: () => void; onDone: () => void; nextSort: number;
  pending: boolean; start: (fn: () => Promise<void>) => void;
}) {
  const [label, setLabel] = useState(row?.label ?? "");
  const [emoji, setEmoji] = useState(row?.emoji ?? "🎉");
  const [active, setActive] = useState(row?.is_active ?? true);
  const [err, setErr] = useState<string | null>(null);
  const save = () => {
    setErr(null);
    start(async () => {
      const r = await saveEventCategoryAction({
        id: row?.id, label, emoji, sort_order: row?.sort_order ?? nextSort, is_active: active,
      });
      if (r.error) { setErr(r.error); return; }
      onDone();
    });
  };
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-sky-50 p-3 ring-1 ring-sky-200">
      <div className="flex gap-2">
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="w-14 rounded-lg border border-ink/15 px-2 py-1.5 text-center text-lg" />
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nama kategori (mis. Workshop, Pelatihan)" className="flex-1 rounded-lg border border-ink/15 px-3 py-1.5 text-sm" autoFocus />
      </div>
      <label className="flex items-center gap-2 text-xs text-ink/70">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
        {active ? "Aktif" : "Nonaktif"}
      </label>
      {err && <p className="text-xs text-rose-700">⚠️ {err}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={pending || !label.trim()} className="flex-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {pending ? "Menyimpan..." : "💾 Simpan"}
        </button>
        <button onClick={onCancel} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-ink/15">Batal</button>
      </div>
    </div>
  );
}

// ==== Event form (dropdown kategori + tombol tambah kategori inline) ====
function EventForm({ row, categories, onSave, onCancel, pending, err }: {
  row: Row | null;
  categories: Category[];
  onSave: (d: { id?: string; category_id: string | null; title: string; description: string; event_date: string | null; price_text: string; form_url: string | null; materi_url: string | null; posted_at: string; unposted_at: string; is_active: boolean }) => void;
  onCancel: () => void; pending: boolean; err: string | null;
}) {
  const router = useRouter();
  const nowIso = new Date().toISOString().slice(0, 16);
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16);
  const [f, setF] = useState<{ category_id: string | null; title: string; description: string; event_date: string; price_text: string; form_url: string; materi_url: string; posted_at: string; unposted_at: string; is_active: boolean }>({
    category_id: row?.category_id ?? (categories[0]?.id ?? null),
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
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const [addCatMode, setAddCatMode] = useState(false);
  const [pendingCat, startCat] = useTransition();

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
      <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">
        Kategori
        <div className="flex gap-1">
          <select value={f.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)} className="flex-1 rounded-lg border border-ink/15 px-2 py-2 text-sm">
            <option value="">— tanpa kategori —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji ? c.emoji + " " : ""}{c.label}</option>)}
          </select>
          {!addCatMode && (
            <button type="button" onClick={() => setAddCatMode(true)} className="shrink-0 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white">+ Baru</button>
          )}
        </div>
      </label>
      {addCatMode && (
        <CategoryInlineForm
          onCancel={() => setAddCatMode(false)}
          onDone={() => { setAddCatMode(false); router.refresh(); }}
          nextSort={categories.length + 1}
          pending={pendingCat}
          start={startCat}
        />
      )}

      <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Judul event" className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-semibold" />
      <textarea value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Deskripsi — apa yang dibahas, siapa yang cocok ikut, dll" rows={4} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">Tanggal & jam event
          <input type="datetime-local" value={f.event_date} onChange={(e) => set("event_date", e.target.value)} className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">Harga (teks bebas)
          <input value={f.price_text} onChange={(e) => set("price_text", e.target.value)} placeholder="Gratis / Rp 150.000 / Donasi" className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
        </label>
      </div>

      <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">Link Google Form (pendaftaran)
        <input value={f.form_url} onChange={(e) => set("form_url", e.target.value)} placeholder="https://forms.gle/..." className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">Link materi/rekaman (Google Drive)
        <input value={f.materi_url} onChange={(e) => set("materi_url", e.target.value)} placeholder="https://drive.google.com/..." className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">Mulai tayang banner
          <input type="datetime-local" value={f.posted_at} onChange={(e) => set("posted_at", e.target.value)} className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-ink/60">Berhenti tayang banner
          <input type="datetime-local" value={f.unposted_at} onChange={(e) => set("unposted_at", e.target.value)} className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4" />
        {f.is_active ? "✅ Aktif" : "🔒 Nonaktif"}
      </label>

      {err && <p className="text-xs text-rose-700">⚠️ {err}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => onSave({
            id: row?.id, category_id: f.category_id,
            title: f.title, description: f.description,
            event_date: f.event_date ? new Date(f.event_date).toISOString() : null,
            price_text: f.price_text,
            form_url: f.form_url || null, materi_url: f.materi_url || null,
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
