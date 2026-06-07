"use client";

import { useState, useTransition } from "react";
import type { EmpathyScenario } from "@/core/empathyScenarios";
import { saveScenarioAction, deleteScenarioAction } from "@/app/admin/games/actions";

type Opt = { text: string; safe: boolean; feedback: string };
const EMPTY: { topic: string; situation: string; options: Opt[] } = {
  topic: "Umum",
  situation: "",
  options: [
    { text: "", safe: true, feedback: "" },
    { text: "", safe: false, feedback: "" },
  ],
};

export function ScenarioEditor({ scenarios }: { scenarios: (EmpathyScenario & { is_active?: boolean })[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [topic, setTopic] = useState("");
  const [situation, setSituation] = useState("");
  const [options, setOptions] = useState<Opt[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startNew() {
    setEditing("new"); setTopic(EMPTY.topic); setSituation(""); setOptions(EMPTY.options.map((o) => ({ ...o }))); setMsg(null);
  }
  function startEdit(s: EmpathyScenario) {
    setEditing(s.id); setTopic(s.topic); setSituation(s.situation); setOptions(s.options.map((o) => ({ ...o }))); setMsg(null);
  }
  function save() {
    startTransition(async () => {
      const res = await saveScenarioAction({
        id: editing === "new" ? undefined : editing ?? undefined,
        topic, situation, options, is_active: true, sort_order: scenarios.length,
      });
      if (res.error) { setMsg(res.error); return; }
      setEditing(null);
    });
  }
  function del(id: string) {
    if (!confirm("Hapus skenario ini?")) return;
    startTransition(async () => { await deleteScenarioAction(id); });
  }

  return (
    <div className="flex flex-col gap-2">
      {scenarios.map((s) => (
        <div key={s.id} className="glass rounded-2xl p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-sky-600">{s.topic}</p>
              <p className="text-sm text-ink/80">{s.situation}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => startEdit(s)} className="text-xs text-sky-600">Edit</button>
              <button type="button" onClick={() => del(s.id)} className="text-xs text-red-500">Hapus</button>
            </div>
          </div>
        </div>
      ))}

      {editing ? (
        <div className="glass rounded-2xl border border-sky-200 p-3">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className="mb-2 w-full rounded-lg border border-sky-100 bg-white/70 px-2 py-1.5 text-sm" placeholder="topik (Umum/Krisis/Duka/...)" />
          <textarea value={situation} onChange={(e) => setSituation(e.target.value)} rows={2} className="mb-2 w-full rounded-lg border border-sky-100 bg-white/70 px-2 py-1.5 text-sm" placeholder="situasi / post yang ditampilkan" />
          {options.map((o, i) => (
            <div key={i} className="mb-2 rounded-lg border border-sky-100 p-2">
              <div className="flex items-center gap-2">
                <input value={o.text} onChange={(e) => setOptions((p) => p.map((x, k) => k === i ? { ...x, text: e.target.value } : x))} className="flex-1 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" placeholder="teks opsi" />
                <label className="flex items-center gap-1 text-[11px] text-ink/60">
                  <input type="checkbox" checked={o.safe} onChange={(e) => setOptions((p) => p.map((x, k) => k === i ? { ...x, safe: e.target.checked } : x))} /> aman
                </label>
                <button type="button" onClick={() => setOptions((p) => p.filter((_, k) => k !== i))} className="text-xs text-red-400">✕</button>
              </div>
              <input value={o.feedback} onChange={(e) => setOptions((p) => p.map((x, k) => k === i ? { ...x, feedback: e.target.value } : x))} className="mt-1 w-full rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" placeholder="feedback kalau dipilih" />
            </div>
          ))}
          <button type="button" onClick={() => setOptions((p) => [...p, { text: "", safe: false, feedback: "" }])} className="text-xs text-sky-600">+ opsi</button>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={save} disabled={pending} className="rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{pending ? "..." : "Simpan"}</button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-full px-3 py-1.5 text-xs text-ink/50">Batal</button>
            {msg && <span className="text-xs text-red-600">{msg}</span>}
          </div>
        </div>
      ) : (
        <button type="button" onClick={startNew} className="self-start rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white">+ Skenario baru</button>
      )}
    </div>
  );
}
