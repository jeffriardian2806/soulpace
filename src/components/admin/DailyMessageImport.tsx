"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importDailyMessagesAction } from "@/app/admin/games/actions";

export function DailyMessageImport() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string[]>([]);
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
      // Ambil kolom A semua baris, skip kosong
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as unknown as (string | number)[][];
      const bodies = rows
        .map((r) => String(r?.[0] ?? "").trim())
        .filter((t) => t.length > 0);
      if (bodies.length === 0) { setErr("Tidak ada isi di kolom A. Pastikan pesan ditulis di kolom pertama."); return; }
      setPreview(bodies);
    } catch (e) {
      console.error(e);
      setErr("Gagal baca file. Pastikan format .xlsx / .xls / .csv.");
    }
  };

  const removeRow = (i: number) => setPreview((p) => p.filter((_, idx) => idx !== i));

  const doImport = () => {
    startTransition(async () => {
      const r = await importDailyMessagesAction(preview);
      if (r.error) { setErr(r.error); return; }
      setDone(r.inserted);
      setPreview([]); setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  };

  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-1 text-base font-bold text-ink">📥 Import dari Excel</h2>
      <p className="mb-3 text-xs leading-relaxed text-ink/55">
        Tulis pesan di <b>kolom A</b>, satu pesan per baris, <b>tanpa header</b> — langsung isi dari baris 1.
        Nomor urut & status aktif diatur otomatis. Format: .xlsx, .xls, atau .csv.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        className="block w-full text-xs text-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-600"
      />

      {err && <p className="mt-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700 ring-1 ring-rose-200">⚠️ {err}</p>}
      {done !== null && <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">✓ {done} pesan berhasil diimport & langsung aktif.</p>}

      {preview.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold text-ink">
            Preview: {preview.length} pesan dari <span className="font-mono">{fileName}</span> — cek dulu, hapus yang salah (misal baris judul kebawa), baru import.
          </p>
          <ul className="mb-3 flex max-h-64 flex-col gap-1 overflow-y-auto">
            {preview.map((b, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-white/70 p-2 ring-1 ring-ink/5">
                <span className="w-6 shrink-0 pt-0.5 text-right font-mono text-[10px] text-ink/40">{i + 1}.</span>
                <span className="flex-1 text-xs leading-relaxed text-ink/80">{b}</span>
                <button onClick={() => removeRow(i)} className="shrink-0 text-xs text-rose-500 hover:underline">Hapus</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button onClick={doImport} disabled={pending} className="flex-1 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {pending ? "Mengimport..." : `✓ Import ${preview.length} Pesan`}
            </button>
            <button onClick={() => { setPreview([]); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink/70 ring-1 ring-ink/15">
              Batal
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
