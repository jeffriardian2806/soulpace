"use client";

import { useState, useTransition } from "react";
import { toggleFeaturePremiumAction, upsertFeatureFlagAction } from "./actions";

type Flag = {
  slug: string;
  name: string;
  description: string | null;
  is_premium: boolean;
  token_cost: number;
  timer_seconds: number | null;
  sort_order: number;
  is_active: boolean;
};

export function FeatureFlagsTable({ items }: { items: Flag[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🎚️ Daftar Fitur — Premium & Timer</h2>
      <p className="mb-3 text-xs leading-relaxed text-ink/55">
        Centang &ldquo;Premium&rdquo; buat ngunci fitur. <strong>🪙 Token cost</strong> = berapa token user dikurangi tiap akses (kalau token-based; subscription bypass).
        <br />
        <strong>⏱️ Timer</strong> = durasi (detik) buat ngerjain fitur. 0/kosong = no timer. Berfungsi di skrining klinis & MHCU (component lain belum support).
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((it) => <li key={it.slug}><FlagRow item={it} /></li>)}
      </ul>
      <div className="mt-3 pt-3 border-t border-sky-100">
        <FlagRow item={{ slug: "", name: "", description: "", is_premium: false, token_cost: 0, timer_seconds: null, sort_order: items.length + 1, is_active: true }} isNew />
      </div>
    </section>
  );
}

function FlagRow({ item, isNew }: { item: Flag; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-sky-100 bg-white/60 p-2">
      <input value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} placeholder="slug" className={`w-32 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs ${isNew ? "" : "opacity-70 cursor-not-allowed"}`} readOnly={!isNew} />
      <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Nama fitur" className="flex-1 min-w-[140px] rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <label className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${v.is_premium ? "bg-purple-500 text-white" : "bg-white text-ink/55 ring-1 ring-sky-100"}`}>
        <input type="checkbox" checked={v.is_premium} onChange={(e) => setV({ ...v, is_premium: e.target.checked })} className="accent-purple-500" />
        💎 Premium
      </label>
      <label className="flex items-center gap-1 text-xs text-ink/65" title="Token cost — berapa token user dikurangi tiap akses">
        🪙 <input type="number" min={0} value={v.token_cost} onChange={(e) => setV({ ...v, token_cost: +e.target.value })} className="w-14 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      </label>
      <label className="flex items-center gap-1 text-xs text-ink/65" title="Timer countdown (detik). 0 = no timer">
        ⏱️ <input type="number" min={0} step={30} value={v.timer_seconds ?? 0} onChange={(e) => setV({ ...v, timer_seconds: +e.target.value > 0 ? +e.target.value : null })} className="w-16 rounded border border-amber-100 bg-amber-50/40 px-2 py-1 text-xs" /><span className="text-[10px] text-ink/45">dtk</span>
      </label>
      <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" title="sort" />
      <label className="flex items-center gap-1 text-xs text-ink/70">
        <input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} /> Aktif
      </label>
      <button
        onClick={() => start(async () => {
          if (isNew) {
            const r = await upsertFeatureFlagAction({ ...v, description: v.description ?? undefined });
            if (r.error) alert(r.error); else setV({ ...item });
          } else {
            const r = await toggleFeaturePremiumAction(v.slug, v.is_premium, v.token_cost, v.timer_seconds);
            if (r.error) alert(r.error);
          }
        })}
        disabled={pending}
        className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
      >
        {pending ? "..." : isNew ? "+ Tambah Fitur" : "Simpan"}
      </button>
    </div>
  );
}
