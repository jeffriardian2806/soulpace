"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importTipsAction } from "@/app/admin/games/edukasi/actions";

export function TipsImport({ topic }: { topic: { slug: string; title: string; emoji: string | null } }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ title: string; content: string }[]>([]);
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const onFile = async (file: File) => {
    setErr(null); setDone(null); setPreview([]);
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) { setErr("File kosong / sheet tidak ditemukan."); return; }
      const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as unknown as (string | number)[][];
      const rows = raw
        .map((r) => ({ title: String(r?.[0] ?? "").trim(), content: String(r?.[1] ?? "").trim() }))
        .filter((r) => r.title.length > 0 || r.content.length > 0);
      const valid = rows.filter((r) => r.title && r.content);
      if (valid.length === 0) { setErr("Tidak ada baris valid. Format: kolom A = judul artikel, kolom B = isi artikel, tanpa header."); return; }
      setPreview(valid);
      if (valid.length < rows.length) setErr(`${rows.length - valid.length} baris di-skip karena judul/isi kosong.`);
    } catch (e) {
      console.error(e);
      setErr("Gagal baca file. Pastikan format .xlsx / .xls / .csv.");
    }
  };

  const removeRow = (i: number) => setPreview((p) => p.filter((_, idx) => idx !== i));

  const doImport = () => {
    startTransition(async () => {
      const r = await importTipsAction({
        topic_slug: topic.slug,
        topic_title: topic.title,
        topic_emoji: topic.emoji,
        rows: preview,
      });
      if (r.error) { setErr(r.error); return; }
      setDone(r.inserted);
      setPreview([]); setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl bg-emerald-50/60 p-3 ring-1 ring-emerald-200">
      <p className="text-xs font-bold text-emerald-800">📥 Import artikel dari Excel — masuk ke topik &ldquo;{topic.title}&rdquo; aja</p>
      <p className="mb-2 mt-0.5 text-[11px] leading-relaxed text-ink/60">
        Kolom A = judul artikel, kolom B = isi artikel. Tanpa header, langsung isi dari baris 1. Semua baris masuk ke topik ini, nggak nyebar ke topik lain.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        className="block w-full text-xs text-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-600"
      />

      {err && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800 ring-1 ring-amber-200">⚠️ {err}</p>}
      {done !== null && <p className="mt-2 rounded-lg bg-emerald-100 p-2 text-[11px] font-semibold text-emerald-800">✓ {done} artikel masuk ke &ldquo;{topic.title}&rdquo; & langsung aktif.</p>}

      {preview.length > 0 && (
        <div className="mt-2">
          <p className="mb-1.5 text-[11px] font-semibold text-ink">Preview {preview.length} artikel dari <span className="font-mono">{fileName}</span>:</p>
          <ul className="mb-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
            {preview.map((r, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-white p-2 ring-1 ring-ink/5">
                <span className="w-5 shrink-0 pt-0.5 text-right font-mono text-[10px] text-ink/40">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-ink">{r.title}</p>
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-ink/60">{r.content}</p>
                </div>
                <button onClick={() => removeRow(i)} className="shrink-0 text-[11px] text-rose-500 hover:underline">Hapus</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button onClick={doImport} disabled={pending} className="flex-1 rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
              {pending ? "Mengimport..." : `✓ Import ${preview.length} artikel ke "${topic.title}"`}
            </button>
            <button onClick={() => { setPreview([]); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }} className="rounded-full bg-white px-3 py-2 text-xs font-medium text-ink/70 ring-1 ring-ink/15">
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
