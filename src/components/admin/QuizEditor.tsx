"use client";

import { useState, useTransition } from "react";
import type { Quiz, QuizQuestion } from "@/core/quizzes";
import { saveQuizAction, deleteQuizAction } from "@/app/admin/games/actions";

type ResultRow = { type: string; label: string; desc: string; wish: string };

export function QuizEditor({ quiz }: { quiz: Quiz & { is_active: boolean } }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(quiz.title);
  const [emoji, setEmoji] = useState(quiz.emoji);
  const [intro, setIntro] = useState(quiz.intro);
  const [active, setActive] = useState(quiz.is_active);
  const [questions, setQuestions] = useState<QuizQuestion[]>(quiz.questions);
  const [results, setResults] = useState<ResultRow[]>(
    Object.entries(quiz.results).map(([type, r]) => ({ type, label: r.label, desc: r.desc, wish: r.wish ?? "" }))
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const setQ = (i: number, q: QuizQuestion) => setQuestions((p) => p.map((x, k) => (k === i ? q : x)));

  function save() {
    const resultsObj: Record<string, { label: string; desc: string; wish?: string }> = {};
    for (const r of results) {
      if (!r.type.trim()) continue;
      resultsObj[r.type.trim()] = { label: r.label, desc: r.desc, ...(r.wish.trim() ? { wish: r.wish.trim() } : {}) };
    }
    startTransition(async () => {
      const res = await saveQuizAction({
        slug: quiz.key, title, emoji, intro, questions, results: resultsObj, is_active: active,
      });
      setMsg(res.error ? `Gagal: ${res.error}` : "Tersimpan ✓");
    });
  }
  function del() {
    if (!confirm(`Hapus kuis "${title}"?`)) return;
    startTransition(async () => { await deleteQuizAction(quiz.key); });
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{emoji} {title} <span className="text-ink/40">/{quiz.key}</span></span>
        <button type="button" onClick={() => setOpen(!open)} className="text-xs font-medium text-sky-600">
          {open ? "Tutup" : "Edit"}
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex gap-2">
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-16 rounded-lg border border-sky-100 bg-white/70 px-2 py-1.5 text-sm" placeholder="emoji" />
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 rounded-lg border border-sky-100 bg-white/70 px-2 py-1.5 text-sm" placeholder="judul" />
          </div>
          <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={2} className="rounded-lg border border-sky-100 bg-white/70 px-2 py-1.5 text-sm" placeholder="intro" />
          <label className="flex items-center gap-2 text-xs text-ink/70">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Aktif
          </label>

          <p className="text-xs font-semibold uppercase text-ink/40">Pertanyaan</p>
          {questions.map((q, qi) => (
            <div key={qi} className="rounded-xl border border-sky-100 p-3">
              <div className="flex gap-2">
                <textarea value={q.text} onChange={(e) => setQ(qi, { ...q, text: e.target.value })} rows={2}
                  className="flex-1 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-sm" placeholder="pertanyaan" />
                <button type="button" onClick={() => setQuestions((p) => p.filter((_, k) => k !== qi))} className="text-xs text-red-500">✕</button>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex gap-1">
                    <input value={o.label} onChange={(e) => setQ(qi, { ...q, options: q.options.map((x, k) => k === oi ? { ...x, label: e.target.value } : x) })}
                      className="flex-1 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" placeholder="opsi" />
                    <input value={o.type} onChange={(e) => setQ(qi, { ...q, options: q.options.map((x, k) => k === oi ? { ...x, type: e.target.value } : x) })}
                      className="w-24 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" placeholder="tipe" />
                    <button type="button" onClick={() => setQ(qi, { ...q, options: q.options.filter((_, k) => k !== oi) })} className="text-xs text-red-400">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => setQ(qi, { ...q, options: [...q.options, { label: "", type: "" }] })} className="self-start text-xs text-sky-600">+ opsi</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setQuestions((p) => [...p, { text: "", options: [{ label: "", type: "" }] }])} className="self-start text-xs text-sky-600">+ pertanyaan</button>

          <p className="text-xs font-semibold uppercase text-ink/40">Hasil (type harus cocok sama tipe opsi)</p>
          {results.map((r, ri) => (
            <div key={ri} className="rounded-xl border border-sky-100 p-2">
              <div className="flex gap-1">
                <input value={r.type} onChange={(e) => setResults((p) => p.map((x, k) => k === ri ? { ...x, type: e.target.value } : x))} className="w-24 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" placeholder="type" />
                <input value={r.label} onChange={(e) => setResults((p) => p.map((x, k) => k === ri ? { ...x, label: e.target.value } : x))} className="flex-1 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" placeholder="label" />
                <input value={r.wish} onChange={(e) => setResults((p) => p.map((x, k) => k === ri ? { ...x, wish: e.target.value } : x))} className="w-20 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" placeholder="wish?" />
                <button type="button" onClick={() => setResults((p) => p.filter((_, k) => k !== ri))} className="text-xs text-red-400">✕</button>
              </div>
              <textarea value={r.desc} onChange={(e) => setResults((p) => p.map((x, k) => k === ri ? { ...x, desc: e.target.value } : x))} rows={2} className="mt-1 w-full rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" placeholder="deskripsi hasil" />
            </div>
          ))}
          <button type="button" onClick={() => setResults((p) => [...p, { type: "", label: "", desc: "", wish: "" }])} className="self-start text-xs text-sky-600">+ hasil</button>

          <div className="flex items-center gap-2">
            <button type="button" onClick={save} disabled={pending} className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">{pending ? "..." : "Simpan"}</button>
            <button type="button" onClick={del} className="rounded-full px-3 py-2 text-xs font-medium text-red-500">Hapus</button>
            {msg && <span className="text-xs text-ink/60">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
