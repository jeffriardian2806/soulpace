"use client";

import { useState, useTransition } from "react";
import { saveResourceAction, deleteResourceAction, type ResourcePayload } from "./actions";

type Item = {
  id: string; slug: string; kind: ResourcePayload["kind"]; title: string; subtitle: string | null; body: string | null;
  url: string | null; phone: string | null; location: string | null; tags: string[]; sort_order: number; is_active: boolean;
};

const KIND_LABEL: Record<ResourcePayload["kind"], string> = {
  crisis_line: "🆘 Crisis Line", psychologist: "🧠 Psikolog", article: "📖 Artikel", community: "🤝 Komunitas", worksheet: "📋 Worksheet",
};

export function ResourceEditor({ items }: { items: Item[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">📋 Daftar Resource</h2>
      <ul className="flex flex-col gap-3">
        {items.map((it) => <li key={it.id}><Row item={it} /></li>)}
      </ul>
      <div className="mt-4 pt-4 border-t border-sky-100">
        <p className="mb-2 text-sm font-bold text-ink">+ Tambah resource baru</p>
        <Row item={{ id: "", slug: "", kind: "article", title: "", subtitle: "", body: "", url: "", phone: "", location: "", tags: [], sort_order: items.length + 1, is_active: true }} isNew />
      </div>
    </section>
  );
}

function Row({ item, isNew }: { item: Item; isNew?: boolean }) {
  const [v, setV] = useState({
    ...item,
    subtitle: item.subtitle ?? "",
    body: item.body ?? "",
    url: item.url ?? "",
    phone: item.phone ?? "",
    location: item.location ?? "",
    tagsStr: item.tags.join(", "),
  });
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(isNew ?? false);

  if (!open && !isNew) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-100 bg-white/60 p-2 text-xs">
        <span className="text-xs">{KIND_LABEL[v.kind]}</span>
        <span className="flex-1 font-semibold text-ink truncate">{v.title}</span>
        {!v.is_active && <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] text-ink/55">nonaktif</span>}
        <span className="text-[10px] text-ink/40">#{v.sort_order}</span>
        <button onClick={() => setOpen(true)} className="text-[10px] text-sky-600">Edit</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sky-200 bg-white/80 p-3">
      <div className="flex flex-wrap gap-2">
        <input value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} placeholder="slug (unik)" className="w-40 rounded-lg border border-sky-100 bg-white px-2 py-1 text-xs" />
        <select value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as Item["kind"] })} className="rounded-lg border border-sky-100 bg-white px-2 py-1 text-xs">
          {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Judul / Nama" className="flex-1 min-w-[180px] rounded-lg border border-sky-100 bg-white px-2 py-1 text-xs" />
      </div>
      <input value={v.subtitle} onChange={(e) => setV({ ...v, subtitle: e.target.value })} placeholder="Subtitle (singkat, italic di display)" className="rounded-lg border border-sky-100 bg-white px-2 py-1 text-xs" />
      <textarea value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} placeholder="Body / deskripsi (opsional)" rows={3} className="rounded-lg border border-sky-100 bg-white px-2 py-1 text-xs leading-relaxed" />
      <div className="flex flex-wrap gap-2">
        <input value={v.url} onChange={(e) => setV({ ...v, url: e.target.value })} placeholder="https://... (URL)" className="flex-1 min-w-[140px] rounded-lg border border-sky-100 bg-white px-2 py-1 text-xs" />
        <input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} placeholder="Nomor telp" className="w-32 rounded-lg border border-sky-100 bg-white px-2 py-1 text-xs" />
        <input value={v.location} onChange={(e) => setV({ ...v, location: e.target.value })} placeholder="Lokasi (kota)" className="w-32 rounded-lg border border-sky-100 bg-white px-2 py-1 text-xs" />
      </div>
      <input value={v.tagsStr} onChange={(e) => setV({ ...v, tagsStr: e.target.value })} placeholder="tag1, tag2, tag3 (pisah koma)" className="rounded-lg border border-sky-100 bg-white px-2 py-1 text-xs" />
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70">
          <input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} /> Aktif (publish)
        </label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-16 rounded-lg border border-sky-100 bg-white px-2 py-1 text-xs" title="sort_order" />
        <button
          onClick={() => start(async () => {
            const tags = v.tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
            const r = await saveResourceAction({
              ...v,
              id: isNew ? undefined : v.id,
              subtitle: v.subtitle, body: v.body, url: v.url, phone: v.phone, location: v.location, tags,
            });
            if (r.error) alert(r.error);
            else if (isNew) setV({ ...item, slug: "", title: "", subtitle: "", body: "", url: "", phone: "", location: "", tagsStr: "" });
            else setOpen(false);
          })}
          disabled={pending}
          className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "..." : isNew ? "+ Tambah" : "Simpan"}
        </button>
        {!isNew && (
          <>
            <button onClick={() => setOpen(false)} className="text-xs text-ink/55">Batal</button>
            <button
              onClick={() => start(async () => { if (confirm("Hapus resource ini?")) { const r = await deleteResourceAction(item.id); if (r.error) alert(r.error); } })}
              className="text-xs text-rose-500"
            >
              Hapus
            </button>
          </>
        )}
      </div>
    </div>
  );
}
