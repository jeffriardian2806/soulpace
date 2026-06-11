"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveInstrumentAction,
  deleteInstrumentAction,
} from "@/app/admin/skrining/actions";
import type { InstrumentPayload } from "@/app/admin/skrining/types";

const DEFAULT_OPTIONS = [
  { label: "Tidak pernah", value: 0 },
  { label: "Beberapa hari", value: 1 },
  { label: "Lebih dari separuh hari", value: 2 },
  { label: "Hampir setiap hari", value: 3 },
];

function blank(): InstrumentPayload {
  return {
    slug: "",
    name: "",
    subtitle: "",
    prompt: "Selama 2 minggu terakhir, seberapa sering kamu terganggu oleh hal-hal berikut?",
    crisisItemPosition: null,
    isActive: true,
    sortOrder: 0,
    options: DEFAULT_OPTIONS.map((o) => ({ ...o })),
    items: [{ text: "", reverse: false }],
    bands: [{ min: 0, max: 0, label: "", advice: "" }],
  };
}

const inputCls =
  "w-full rounded-xl border border-ink/10 bg-white/60 p-2.5 text-sm text-ink outline-none focus:border-sky-300";

export function InstrumentForm({ initial }: { initial?: InstrumentPayload }) {
  const router = useRouter();
  const [f, setF] = useState<InstrumentPayload>(initial ?? blank());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof InstrumentPayload>(k: K, v: InstrumentPayload[K]) {
    setF((p) => ({ ...p, [k]: v }));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await saveInstrumentAction(f);
      if (res.ok) router.push("/admin/skrining");
      else setError(res.error ?? "Gagal menyimpan.");
    });
  }

  function remove() {
    if (!f.id) return;
    if (!confirm("Hapus instrumen ini beserta semua pertanyaannya?")) return;
    startTransition(async () => {
      const res = await deleteInstrumentAction(f.id!);
      if (res.ok) router.push("/admin/skrining");
      else setError(res.error ?? "Gagal menghapus.");
    });
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-600">{error}</p>
      )}

      {/* Info dasar */}
      <section className="glass space-y-3 rounded-2xl p-4">
        <h2 className="text-sm font-bold text-ink">Info instrumen</h2>
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} placeholder="Nama (mis. PHQ-9)" value={f.name} onChange={(e) => set("name", e.target.value)} />
          <input className={inputCls} placeholder="Slug unik (mis. phq9)" value={f.slug} onChange={(e) => set("slug", e.target.value)} />
        </div>
        <input className={inputCls} placeholder="Subjudul (mis. Gejala depresi)" value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
        <textarea className={inputCls} rows={2} placeholder="Kalimat pengantar pertanyaan" value={f.prompt} onChange={(e) => set("prompt", e.target.value)} />
        <div className="flex flex-wrap items-center gap-4 text-sm text-ink/70">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={f.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            Aktif (tampil ke publik)
          </label>
          <label className="flex items-center gap-2">
            Urutan
            <input type="number" className="w-16 rounded-lg border border-ink/10 bg-white/60 p-1 text-sm" value={f.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
          </label>
          <label className="flex items-center gap-2">
            Item pemicu krisis (nomor, kosongkan jika tidak ada)
            <input type="number" className="w-16 rounded-lg border border-ink/10 bg-white/60 p-1 text-sm" value={f.crisisItemPosition ?? ""} onChange={(e) => set("crisisItemPosition", e.target.value === "" ? null : Number(e.target.value))} />
          </label>
        </div>
      </section>

      {/* Opsi jawaban */}
      <section className="glass space-y-2 rounded-2xl p-4">
        <h2 className="text-sm font-bold text-ink">Opsi jawaban &amp; skor</h2>
        {f.options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={inputCls} placeholder="Label opsi" value={o.label} onChange={(e) => set("options", f.options.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <input type="number" className="w-20 rounded-xl border border-ink/10 bg-white/60 p-2.5 text-sm" placeholder="Skor" value={o.value} onChange={(e) => set("options", f.options.map((x, j) => (j === i ? { ...x, value: Number(e.target.value) } : x)))} />
            <button type="button" onClick={() => set("options", f.options.filter((_, j) => j !== i))} className="text-rose-500">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => set("options", [...f.options, { label: "", value: f.options.length }])} className="text-xs font-medium text-sky-600">+ Tambah opsi</button>
      </section>

      {/* Pertanyaan */}
      <section className="glass space-y-2 rounded-2xl p-4">
        <h2 className="text-sm font-bold text-ink">Pertanyaan</h2>
        {f.items.map((it, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="pt-2.5 text-xs text-ink/40">{i + 1}.</span>
            <div className="flex flex-1 flex-col gap-1">
              <textarea
                className={inputCls}
                rows={2}
                placeholder="Teks pertanyaan"
                value={it.text}
                onChange={(e) => set("items", f.items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
              />
              <label className="flex items-center gap-1.5 text-[11px] text-ink/55">
                <input
                  type="checkbox"
                  checked={it.reverse}
                  onChange={(e) => set("items", f.items.map((x, j) => (j === i ? { ...x, reverse: e.target.checked } : x)))}
                />
                Reverse (skor di-invert untuk item ini)
              </label>
            </div>
            <button type="button" onClick={() => set("items", f.items.filter((_, j) => j !== i))} className="pt-2.5 text-rose-500">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => set("items", [...f.items, { text: "", reverse: false }])} className="text-xs font-medium text-sky-600">+ Tambah pertanyaan</button>
      </section>

      {/* Band skor */}
      <section className="glass space-y-2 rounded-2xl p-4">
        <h2 className="text-sm font-bold text-ink">Rentang skor &amp; hasil</h2>
        {f.bands.map((b, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-ink/5 p-2">
            <div className="flex items-center gap-2">
              <input type="number" className="w-16 rounded-lg border border-ink/10 bg-white/60 p-2 text-sm" placeholder="Min" value={b.min} onChange={(e) => set("bands", f.bands.map((x, j) => (j === i ? { ...x, min: Number(e.target.value) } : x)))} />
              <span className="text-ink/40">–</span>
              <input type="number" className="w-16 rounded-lg border border-ink/10 bg-white/60 p-2 text-sm" placeholder="Max" value={b.max} onChange={(e) => set("bands", f.bands.map((x, j) => (j === i ? { ...x, max: Number(e.target.value) } : x)))} />
              <input className={inputCls} placeholder="Label (mis. Sedang)" value={b.label} onChange={(e) => set("bands", f.bands.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <button type="button" onClick={() => set("bands", f.bands.filter((_, j) => j !== i))} className="text-rose-500">✕</button>
            </div>
            <textarea className={inputCls} rows={2} placeholder="Saran/penjelasan untuk rentang ini" value={b.advice} onChange={(e) => set("bands", f.bands.map((x, j) => (j === i ? { ...x, advice: e.target.value } : x)))} />
          </div>
        ))}
        <button type="button" onClick={() => set("bands", [...f.bands, { min: 0, max: 0, label: "", advice: "" }])} className="text-xs font-medium text-sky-600">+ Tambah rentang</button>
      </section>

      <div className="flex gap-3">
        <button type="button" onClick={save} disabled={pending} className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        {f.id && (
          <button type="button" onClick={remove} disabled={pending} className="rounded-xl px-5 py-2.5 text-sm font-medium text-rose-500">
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}
