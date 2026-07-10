"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveUiTextAction } from "../actions";

type Row = { key: string; value: string };

export function UiTextEditor({ items }: { items: Row[] }) {
  // grup per page: admin.<page>.title/subtitle
  const groups: Record<string, Row[]> = {};
  for (const r of items) {
    const page = r.key.split(".")[1] ?? "lainnya";
    (groups[page] ??= []).push(r);
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-lg bg-sky-50 p-2 text-[11px] leading-relaxed text-sky-800 ring-1 ring-sky-200">
        Ganti judul & penjelasan halaman admin di sini biar lebih gampang dipahami. Simpan per baris. Perubahan langsung tampil.
      </p>
      {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([page, rows]) => (
        <details key={page} className="rounded-xl bg-white p-3 ring-1 ring-ink/10">
          <summary className="cursor-pointer text-sm font-bold text-ink">{page}</summary>
          <div className="mt-2 flex flex-col gap-2">
            {rows.sort((a, b) => a.key.localeCompare(b.key)).map((r) => <TextRow key={r.key} row={r} />)}
          </div>
        </details>
      ))}
    </div>
  );
}

function TextRow({ row }: { row: Row }) {
  const router = useRouter();
  const [v, setV] = useState(row.value);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const label = row.key.endsWith(".title") ? "Judul" : "Penjelasan";
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">{label}</p>
      <div className="flex items-start gap-2">
        <textarea value={v} onChange={(e) => { setV(e.target.value); setSaved(false); }} rows={label === "Judul" ? 1 : 2} className="flex-1 rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
        <button
          onClick={() => start(async () => { const r = await saveUiTextAction(row.key, v); if (r.error) alert(r.error); else { setSaved(true); router.refresh(); } })}
          disabled={pending || v === row.value}
          className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
        >{pending ? "..." : saved ? "✓" : "Simpan"}</button>
      </div>
    </div>
  );
}
